import Shippo from 'shippo';
import { requireEnv } from './env';

const shippo = new Shippo(process.env.SHIPPO_API_KEY || '');

// Default origin address (Butterfly Fashion Trading, Toronto)
// In a real app, these should be in environment variables or a settings table
const ORIGIN_ADDRESS = {
  name: 'Butterfly Fashion Trading',
  street1: '123 Fashion St', // Placeholder
  city: 'Toronto',
  state: 'ON',
  zip: 'M5V 2L1',
  country: 'CA',
  phone: '416-555-0199',
  email: 'orders@butterflyfashion.com',
};

export async function getShippingRates(destination: {
  name: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}, items: Array<{
  name: string;
  quantity: number;
  weight: number;
  weight_unit: string;
  length?: number;
  width?: number;
  height?: number;
  distance_unit?: string;
}>) {
  try {
    // Basic parcel calculation: sum of weights
    // For a more advanced implementation, we'd use multiple parcels or a box packer
    const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) * item.quantity), 0);
    const weightUnit = items[0]?.weight_unit || 'oz';

    const shipment = await shippo.shipment.create({
      address_from: ORIGIN_ADDRESS,
      address_to: destination,
      parcels: [{
        length: 12, // Default parcel size if not specified
        width: 12,
        height: 12,
        distance_unit: 'in',
        weight: totalWeight || 1, // Minimum weight 1
        mass_unit: weightUnit,
      }],
      async: false,
    });

    // Filter and format rates
    return shipment.rates.map((rate: any) => ({
      id: rate.object_id,
      carrier: rate.provider,
      service: rate.servicelevel.name,
      amount: rate.amount,
      currency: rate.currency,
      estimated_days: rate.estimated_days,
      duration_terms: rate.duration_terms,
    })).sort((a: any, b: any) => Number(a.amount) - Number(b.amount));
  } catch (error) {
    console.error('Shippo error:', error);
    throw new Error('Failed to fetch shipping rates');
  }
}
