import "./App.css";
import {
    ConnectButton,
    useCurrentAccount,
    useSuiClientQuery,
    useSignAndExecuteTransactionBlock,
    useSignPersonalMessage,
} from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useEffect, useState } from "react";
import { SuiClient } from "@mysten/sui.js/client";

function App() {
    const account = useCurrentAccount();
    const [targetWallet, setTargetWallet] = useState("");

    const [message, setMessage] = useState('Hello, World!');
	const [signature, setSignature] = useState('');
    const [userBalance, setUserBalance] = useState(0);

    const { mutate: signPersonalMessage } = useSignPersonalMessage();

    const { data } = useSuiClientQuery("getOwnedObjects", {
        owner: account?.address as string,
    });
    console.log(data);

    const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();

    const getBalance = async (walletAddress: string) => {
        const suiClient = new SuiClient({ url: "https://fullnode.testnet.sui.io" }); // Using testnet
        const balanceObj = await suiClient.getCoins({
            owner: walletAddress,
            limit: 100,
        });
    
        const balance = balanceObj.data
            .filter((coinObj) => coinObj.coinType === "0x2::sui::SUI")
            .reduce((acc, obj) => acc + parseInt(obj.balance), 0);
        setUserBalance(balance);
    };

    const transferBalance = () => {
        const txb = new TransactionBlock();

        const coin = txb.splitCoins(txb.gas, [10]);
        txb.transferObjects([coin], "RECEIVER_SUI_WALLET_ADDRESS");

        signAndExecuteTransactionBlock({
            transactionBlock: txb,
        }).then(async (result) => {
            console.log("Sui transferred successfully.");
            console.log("Result:", result);
        });
    };

    const transferNFT = () => {
        const txb = new TransactionBlock();

        txb.transferObjects(["NFT_ADDRESS"], "RECEIVER_SUI_WALLET_ADDRESS");

        signAndExecuteTransactionBlock({
            transactionBlock: txb,
        }).then(async (result) => {
            console.log("NFT transferred successfully.");
            console.log("Result:", result);
        });
    };

    const mintNFT = async () => {
        const txb = new TransactionBlock();
        txb.moveCall({
            target: "0x5ea6aafe995ce6506f07335a40942024106a57f6311cb341239abf2c3ac7b82f::nft::mint",
            arguments: [
            txb.pure("Suiet NFT"),
            txb.pure("Suiet Sample NFT"),
            txb.pure(
                "https://xc6fbqjny4wfkgukliockypoutzhcqwjmlw2gigombpp2ynufaxa.arweave.net/uLxQwS3HLFUailocJWHupPJxQsli7aMgzmBe_WG0KC4"
            ),
            ],
        });

        await signAndExecuteTransactionBlock({
            transactionBlock: txb,
        }).then(async (result) => {
            console.log("NFT minted successfully.");
            console.log("Result:", result);
            alert(`Mint transaction successful. Transaction digest: ${result.digest}`);
        });
    }

    useEffect(() => {
        if (account?.address) getBalance(account?.address);
    }, [account?.address])

    return (
        <div className="app">
            <h3>SUI @mysten/dapp-kit Implementation</h3>

            <ConnectButton />

            <div>Account address: {account?.address}</div>
            <div>Account balance: {userBalance * 10 ** -9}</div>

            <div>
                <h3>Owned Objects:</h3>

                {data?.data?.map((object) => (
                    <div key={object.data?.objectId}>
                        {object.data?.objectId}
                    </div>
                ))}
            </div>

            <div>
                <h3>Transferring SUI</h3>

                <div
                    style={{
                        display: "flex",
                        gap: "12px"
                    }}
                >
                    <input
                        name="targetWallet"
                        value={targetWallet}
                        onChange={e => setTargetWallet(e.target.value)}
                        placeholder="Target Wallet Address"
                    />
                    <button onClick={transferBalance}>Transfer SUI</button>
                </div>
            </div>

            <div className="message-signing">
                <h3>Message Signing</h3>

                <div>
                    Message:{' '}
                    <input type="text" value={message} onChange={(ev) => setMessage(ev.target.value)} />
                </div>
                
                <button
                    onClick={() => {
                        signPersonalMessage(
                            {
                                message: new TextEncoder().encode(message),
                            },
                            {
                                onSuccess: (result) => setSignature(result.signature),
                            },
                        );
                    }}
                >
                    Sign message
                </button>
                <div>Signature: {signature}</div>

                <button onClick={transferNFT}>Transfer NFT</button>
            </div>

            <div>
                <h3>Minting Transaction</h3>
                <button onClick={mintNFT}>Mint NFT</button>
            </div>
        </div>
    );
}

export default App;
