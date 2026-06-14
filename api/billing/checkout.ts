import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin, supabase, getAuthUser } from "../_utils/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Access denied. Invalid or missing session token." });
  }

  try {
    const { productId, email, customToken, customStarterId, customProId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Missing productId specification" });
    }

    const polarToken = customToken || process.env.POLAR_API_TOKEN || "";
    const origin = req.headers.referer || req.headers.origin || "http://localhost:3000";

    if (email === "farooquiumair18@gmail.com") {
      console.log(`[Admin Billing Bypass] Auto-upgrading farooquiumair18@gmail.com to ${productId}...`);
      const activeClient = supabaseAdmin || supabase;
      const { error: upgradeErr } = await activeClient
        .from("profiles")
        .update({ plan: productId })
        .eq("email", "farooquiumair18@gmail.com");
      
      if (upgradeErr) {
        console.error("[Admin Billing Bypass] Failed to auto-upgrade:", upgradeErr);
      }
      
      const successUrl = `${origin.split('?')[0]}?payment_success=true&plan_choice=${productId}`;
      return res.status(200).json({ checkoutUrl: successUrl });
    }

    // Dynamically resolve final Polar Product ID
    let finalProductId = productId;
    if (productId === "starter") {
      finalProductId = customStarterId || process.env.POLAR_STARTER_PRODUCT_ID || "2181cbf5-01d7-4d92-addd-716d658acfff";
    } else if (productId === "pro") {
      finalProductId = customProId || process.env.POLAR_PRO_PRODUCT_ID || "10b53983-e9e0-4d2a-b665-71798bf8618e";
    } else {
      const defaultStarter = "2181cbf5-01d7-4d92-addd-716d658acfff";
      const defaultPro = "10b53983-e9e0-4d2a-b665-71798bf8618e";
      if (productId === defaultStarter) {
        finalProductId = customStarterId || process.env.POLAR_STARTER_PRODUCT_ID || defaultStarter;
      } else if (productId === defaultPro) {
        finalProductId = customProId || process.env.POLAR_PRO_PRODUCT_ID || defaultPro;
      }
    }

    const isSandbox = polarToken.includes("sb") || polarToken.includes("sandbox");
    const apiHost = isSandbox ? "https://sandbox-api.polar.sh" : "https://api.polar.sh";
    const buyHost = isSandbox ? "https://sandbox-buy.polar.sh" : "https://buy.polar.sh";

    console.log(`[Polar Billing] Creating session for Product ID: ${finalProductId} via ${apiHost} (isSandbox: ${isSandbox})...`);

    const polarResponse = await fetch(`${apiHost}/v1/checkouts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${polarToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product_id: finalProductId,
        success_url: `${origin}?payment_success=true&plan_choice=${productId}&plan_product_id=${finalProductId}`,
        cancel_url: `${origin}?payment_cancel=true&plan_choice=${productId}&plan_product_id=${finalProductId}`,
        customer_email: email || undefined
      })
    });

    if (polarResponse.ok) {
      const resJson = await polarResponse.json();
      console.log("Polar Checkout session completed successfully:", resJson.url);
      return res.status(200).json({ checkoutUrl: resJson.url || `${buyHost}/${finalProductId}` });
    } else {
      const errorText = await polarResponse.text();
      console.warn(`Polar API responded with status ${polarResponse.status}:`, errorText);
      const directUrl = `${buyHost}/${finalProductId}`;
      return res.status(200).json({ checkoutUrl: directUrl, isFallback: true });
    }
  } catch (err: any) {
    console.error("Polar subscription integration session creation failed:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch checkout url" });
  }
}
