"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { sendContactNotificationEmail } from "@/lib/email";

export async function submitContactMessage(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";

  if (!name || !email || !message) {
    return { success: false, error: "All fields are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email." };
  }
  if (message.length > 2000) {
    return { success: false, error: "Message is too long (max 2000 characters)." };
  }

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("contact_messages")
      .insert({ name, email, message })
      .select("id")
      .single();

    if (error) throw error;

    await sendContactNotificationEmail({
      messageId: data.id,
      name,
      email,
      message,
    }).catch((err) => console.error("[contact] Failed to send admin email:", err));

    return { success: true };
  } catch (err) {
    console.error("[contact] submitContactMessage error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
