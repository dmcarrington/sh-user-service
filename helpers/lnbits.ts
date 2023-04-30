const axios = require("axios").default;
const { SocksProxyAgent } = require("socks-proxy-agent");
const { v4: uuidv4 } = require("uuid");

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function createLnbitsAccount() {
  try {
    const httpAgent = new SocksProxyAgent(process.env.SOCKS_PROXY_AGENT);
    console.log(httpAgent);
    const httpsAgent = httpAgent;

    const newUserURL = process.env.LNBITS_ADDRESS + "/usermanager/api/v1/users";
    const user_name = uuidv4();
    const wallet_name = "satoshis_hive";
    const admin_id = process.env.LNBITS_ADMIN_ID;
    const lnbitsApiKey = process.env.LNBITS_API_KEY;

    const result = await axios({
      httpAgent: httpAgent,
      httpsAgent: httpsAgent,
      method: "post",
      url: newUserURL,
      data: {
        admin_id: admin_id,
        user_name: user_name,
        wallet_name: wallet_name,
      },
      headers: { "X-Api-Key": lnbitsApiKey },
    });

    console.log(result.data);
    return {
      user_name: user_name,
      user_id: result.data.id,
      wallet_name: wallet_name,
      wallet_id: result.data.wallets[0].id,
    };
  } catch (err) {
    console.log("error: " + getErrorMessage(err));
  }
}
