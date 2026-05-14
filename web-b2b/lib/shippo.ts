import Shippo from 'shippo';

// Use correct origin address from B2C site which is known to work
const ORIGIN_ADDRESS = {
  name: process.env.STORE_NAME || 'World Fan Gear',
  street1: process.env.STORE_STREET || '178 Bentworth Ave',
  city: process.env.STORE_CITY || 'North York',
  state: process.env.STORE_PROVINCE || 'ON',
  zip: process.env.STORE_POSTAL || 'M6A 1P7',
  country: 'CA',
  phone: '416-555-0199',
  email: 'orders@worldfangear.com',
};

// Handle shippo package being a function or a constructor
function getShippoClient() {
    const apiKey = process.env.SHIPPO_API_KEY || '';
    if (typeof Shippo === 'function') {
        return (Shippo as any)(apiKey);
    }
    // @ts-ignore
    return new Shippo(apiKey);
}

const shippo = getShippoClient();

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
    const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) * item.quantity), 0);
    const weightUnit = items[0]?.weight_unit || 'oz';

    const shipment = await shippo.shipment.create({
      address_from: ORIGIN_ADDRESS,
      address_to: destination,
      parcels: [{
        length: 12,
        width: 12,
        height: 12,
        distance_unit: 'in',
        weight: totalWeight || 1,
        mass_unit: weightUnit,
      }],
      async: false,
    });

    if (!shipment.rates) {
        console.error('Shippo shipment created but no rates returned:', shipment);
        return [];
    }

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
