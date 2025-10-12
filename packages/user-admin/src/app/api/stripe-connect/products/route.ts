import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type Stripe from 'stripe';
import { getStripe, isStripeConnectEnabled } from '@/lib/stripe';

const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2).max(200).optional(),
  price: z.number().int().positive('Price must be expressed in cents and be positive.'),
  currency: z.string().length(3).default('usd'),
  connectedAccountId: z.string().min(3),
});

// Helper to normalise Stripe's expanded product payload into a tiny JSON object the UI can consume.
function mapProduct(product: Stripe.Product & { default_price?: Stripe.Price | null }) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    connectedAccountId: product.metadata.connected_account_id ?? null,
    defaultPrice: product.default_price
      ? {
          id: typeof product.default_price === 'string' ? product.default_price : product.default_price.id,
          unitAmount:
            typeof product.default_price === 'string'
              ? null
              : product.default_price.unit_amount,
          currency:
            typeof product.default_price === 'string'
              ? null
              : product.default_price.currency,
        }
      : null,
    metadata: product.metadata,
  };
}

// List platform products with their default price expanded. Each product stores the connected account ID inside
// metadata so destination charges know where to send funds.
export async function GET() {
  try {
    if (!isStripeConnectEnabled()) {
      return NextResponse.json({ error: 'Stripe Connect demo is disabled.' }, { status: 404 });
    }

    const stripe = getStripe();
    const products = await stripe.products.list({
      expand: ['data.default_price'],
      limit: 50,
    });

    return NextResponse.json({
      products: products.data.map((product) => mapProduct(product as Stripe.Product & { default_price?: Stripe.Price | null })),
    });
  } catch (error) {
    console.error('Stripe Connect products GET error', error);
    return NextResponse.json(
      {
        error: 'Unable to fetch products from Stripe.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 },
    );
  }
}

// Create a platform product with a default price. We store the connected account identifier inside metadata.
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConnectEnabled()) {
      return NextResponse.json({ error: 'Stripe Connect demo is disabled.' }, { status: 404 });
    }

    const payload = createProductSchema.parse(await request.json());

    const stripe = getStripe();

    const product = await stripe.products.create({
      name: payload.name,
      description: payload.description,
      metadata: {
        connected_account_id: payload.connectedAccountId,
      },
      default_price_data: {
        unit_amount: payload.price,
        currency: payload.currency,
      },
    });

    const expanded = await stripe.products.retrieve(product.id, {
      expand: ['default_price'],
    });

    return NextResponse.json({ product: mapProduct(expanded as Stripe.Product & { default_price?: Stripe.Price | null }) });
  } catch (error) {
    console.error('Stripe Connect products POST error', error);
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json(
      {
        error: error instanceof z.ZodError ? 'Invalid product payload.' : 'Unable to create product in Stripe.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status },
    );
  }
}
