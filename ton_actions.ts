import { Event } from "./wrappers/Event";
import { WalletContractV3R2, TonClient, Address } from "ton";
import { mnemonicToWalletKey } from "ton-crypto";
const getSenderFromMnemonic = async (mnemonic: string, client: TonClient) => {
  const keypair = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV3R2.create({
    publicKey: keypair.publicKey,
    workchain: 0,
  });
  const sender = wallet.sender(
    client.provider(wallet.address, wallet.init),
    keypair.secretKey
  );
  return sender;
};

const getTestClient = () => {
  const client = new TonClient({
    endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    apiKey: "3ee6e55a86a7d611e3670f650d4194656157ecf100d5d284dcdb9d873d8fb37d",
  });
  return client;
};

const createEvent = async () => {
  try {
    // Configure the Ton client
    const client = getTestClient();
    const mnemonic: string = process.env.MNEMONIC1 as any;

    const keypair = await mnemonicToWalletKey(mnemonic.split(" "));
    console.log(keypair.publicKey);
    const wallet = WalletContractV3R2.create({
      publicKey: keypair.publicKey,
      workchain: 0,
    });

    console.log(`Wallet address ${wallet.address}`);
    const oracle = wallet.address;
    const sender = await getSenderFromMnemonic(
      process.env.MNEMONIC2 as any,
      client
    );
    const uid = 1234567890;
    const event = await Event.create(client, oracle, uid);
    await event.deploy(sender);

    // Get the Event address
    const addr = event.address;
    console.log(`event address: ${addr}`);

    const response = {
      status: "success",
      message: "New event created successfully",
      data: {
        address: `${addr}`,
      },
    };

    return response;
  } catch (error) {
    console.log(error);
    const response = {
      status: "error",
      message: error,
      data: null,
    };
    console.log(response);
  }
};

const finishEvent = async (address: string, result: number) => {
  const client = getTestClient();
  const senderNew = await getSenderFromMnemonic(
    process.env.MNEMONIC1 as any,
    client
  );
  const addr = Address.parse(address);
  const eventNew = await Event.getInstance(client, addr);
  await eventNew.finishEvent(senderNew, result);
  const response = {
    status: "success",
    message: "Event finished successfully",
    data: null,
  };
  console.log(response);
  return response;
};

export { getSenderFromMnemonic, getTestClient, createEvent, finishEvent };
