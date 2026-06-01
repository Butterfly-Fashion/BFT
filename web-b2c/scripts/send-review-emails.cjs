const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user: "jameskimkim1@gmail.com", pass: "uacqweshroxshayp" },
});

const buyers = [
  {
    firstName: "Nathalia",
    email: "nathalia.galvis@gmail.com",
    slug: "panini-fifa-world-cup-2026-sticker-box-50-packs",
    product: "Panini Sticker Box – 50 Packs",
  },
  {
    firstName: "Andres",
    email: "andresa1301@hotmail.com",
    slug: "panini-fifa-world-cup-2026-sticker-box-50-packs",
    product: "Panini Sticker Box – 50 Packs",
  },
  {
    firstName: "Damir",
    email: "dambamisev@gmail.com",
    slug: "panini-fifa-world-cup-2026-sticker-box-50-packs",
    product: "Panini Sticker Box – 50 Packs",
  },
];

const SITE = "https://fifa2026.ca";

function buildHtml(firstName, slug, product) {
  const reviewUrl = SITE + "/products/" + slug + "#reviews";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

    <div style="background:#1a1a2e;padding:28px 32px;text-align:center;">
      <p style="margin:0;color:#ffffff;font-size:18px;font-weight:800;">World Fan Gear</p>
      <p style="margin:6px 0 0;color:#a0aec0;font-size:13px;">Official FIFA World Cup 2026 Merchandise · Toronto</p>
    </div>

    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a2e;">How's your collection going, ${firstName}?</p>
      <p style="margin:0 0 20px;font-size:15px;color:#4a5568;line-height:1.6;">
        Hope your <strong>${product}</strong> arrived safely and the opening session was a blast!
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
        Would you take 30 seconds to leave a quick review? It helps other Canadian fans decide — and it means a lot to our small team in Toronto.
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a href="${reviewUrl}"
           style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;">
          Leave a Review &#11088;
        </a>
      </div>

      <p style="margin:0;font-size:13px;color:#718096;line-height:1.6;">
        With the World Cup kicking off <strong>June 12</strong>, now's the perfect time to grab more packs if you need them.
        We just added <a href="${SITE}/products/panini-fifa-world-cup-2026-sticker-packs-5" style="color:#16a34a;">5-pack</a>,
        <a href="${SITE}/products/panini-fifa-world-cup-2026-sticker-packs-10" style="color:#16a34a;">10-pack</a>, and
        <a href="${SITE}/products/panini-fifa-world-cup-2026-sticker-packs-20" style="color:#16a34a;">20-pack</a> options too!
      </p>
    </div>

    <div style="background:#f7fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#a0aec0;text-align:center;">
        World Fan Gear &middot; Toronto, ON &middot;
        <a href="${SITE}" style="color:#a0aec0;">fifa2026.ca</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  for (const buyer of buyers) {
    const html = buildHtml(buyer.firstName, buyer.slug, buyer.product);
    await transporter.sendMail({
      from: "World Fan Gear <jameskimkim1@gmail.com>",
      to: buyer.email,
      subject: "Quick question about your Panini stickers ⭐",
      html,
    });
    console.log("Sent to:", buyer.email);
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log("Done — all 3 review emails sent.");
}

main().catch((err) => { console.error(err); process.exit(1); });
