const axios = require("axios");
const crypto = require("crypto");

async function createMomoPaymentUrl({ amount, orderId, orderInfo, returnUrl }) {
  // Lấy thông tin từ biến môi trường hoặc hardcode để test
  const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
  const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
  const accessKey = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
  const secretKey = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const redirectUrl = returnUrl || "http://localhost:3000/cart/thankyou";
  const ipnUrl = returnUrl || "http://localhost:3000/cart/thankyou";
  const requestId = partnerCode + Date.now();
  const requestType = "captureWallet";
  const extraData = "";

  // Tạo rawSignature đúng thứ tự
  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = crypto.createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const body = {
    partnerCode,
    accessKey,
    requestId,
    amount: amount.toString(),
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: "vi"
  };

  // Gửi request đến MoMo
  const response = await axios.post(endpoint, body, {
    headers: { 'Content-Type': 'application/json' }
  });

  // Trả về link thanh toán
  return response.data.payUrl;
}

module.exports = { createMomoPaymentUrl };