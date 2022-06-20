import React, { useEffect,useState } from 'react'
import Web3 from "web3"
import NewJholeKeta from './abi/NewJholeKeta.json';

function App() {

    const [contract,setContract] = useState({});
    const [loading,setLoading] = useState(false);
    const [contractLoading,setContractLoading] = useState(false);
    const [account,setAccount] = useState('');
    const [error,setError] = useState('');
    const [networkData,setNetworkData] = useState('');
    const [walletExists,setWalletExists] = useState('');
    const [nftData,setNftData] = useState();
    const [number,setNumber] = useState(1);

    const [addressToAdd,setAddressToAdd] = useState('');

    const web3 = new Web3(window.ethereum);
    //check ethereum provider
      //Load account data 
      const loadWeb3AndData = async()=>{
        setLoading(true);
        if (window.ethereum) {
          try {
           
            //web3 comes from here................
         
            
            setWalletExists(true);

            instantiateContract();
            
  
          } catch (error) {
            if (error.code === 4001) {
              // User rejected request
              console.log("User refused to connect");
              setError("User refused to connect");
            }
        
            setError(error.message);
          }
        }
        else{
          setWalletExists(false);
        }
        setLoading(false);
      }
  
      const instantiateContract  = async()=>{
                //these both work 
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            //const accounts = await web3.eth.getAccounts();
            console.log(accounts)
          setAccount(accounts[0]);
          
          const networkId =await window.ethereum.request({ method: 'net_version' });
          console.log("networkId",networkId)
          const tempnetworkData =  NewJholeKeta.networks[networkId]
          console.log("tempnetworkData",tempnetworkData)
          
          if(tempnetworkData){
            setContractLoading(true);
            setNetworkData(tempnetworkData);
            let abi = NewJholeKeta.abi;
            let contractAddress = tempnetworkData.address;
            let contract =await new web3.eth.Contract(abi,contractAddress);
            
            setContract(contract);
            if(contract){
                let maxSupply = await contract.methods.maxSupply().call();
                let totalSupply = await contract.methods.totalSupply().call();
                let maxMintAmount = await contract.methods.maxMintAmount().call();
                let maxAmountForAnAccount = await contract.methods.maxAmountForAnAccount().call();
                let revealed =  await contract.methods.revealed().call();
                let cost = await contract.methods.cost().call();
                let myWallet = await contract.methods.balanceOf(accounts[0]).call();
                let ownerAddress = await contract.methods.owner().call();

                console.log( totalSupply,
                    maxMintAmount,
                    maxAmountForAnAccount,
                    revealed,
                    cost)
                setNftData({
                    totalSupply,
                    maxSupply,
                    maxMintAmount,
                    maxAmountForAnAccount,
                    revealed,
                    cost,
                    myWallet,
                    ownerAddress
                });
            }

            setContractLoading(false)
          }
      }
  
      useEffect(()=>{
        //loadWeb3();
        loadWeb3AndData();
      },[]);

      const mintNFTs = async()=>{
        setLoading(true);
        let isWhiteListed = await contract.methods.isAccountWhiteListed().call({
            from:account
        });
        console.log("account==nftData.ownerAddress", account.toUpperCase()==nftData.ownerAddress.toUpperCase())
        console.log(account.toUpperCase(),nftData.ownerAddress.toUpperCase())
        if(!(isWhiteListed || account.toUpperCase()==nftData.ownerAddress.toUpperCase())){
            await contract.methods.mint(number).send({
                from:account,
                value:nftData.cost * number
            });
        }
        else{
            await contract.methods.mint(number).send({
                from:account,
            });
        }
        setLoading(false);
        setNumber(1);
          instantiateContract();

      }

      const changeNumber = (value)=>{
          setNumber(value);
          console.log(value)
      }

      const changeAddress = (value)=>{
        setAddressToAdd(value);
      }

      const addAddress = async()=>{
          await contract.methods.addWhiteListedMember(addressToAdd).send({
              from:account
          })
          setAddressToAdd('');
      }

  return (
    <div style={{padding:"4rem 2rem",textAlign:"center"}}>
        <h1>Jhole Keta NFT</h1>
        <div style={{width:"70%",margin:"2rem auto", fontSize:"18px"}}>
            <b>Welcome to the minting platform!!</b><br/><br/>

            * <i>If you are whitelisted member, no cost will be there for minting NFT</i> *
        </div>
        
        <div style={{width:"700px", margin:"auto",minHeight:"300px", borderRadius:"8px", border:"3px solid grey"}}>
               
        {
            contractLoading?
            <h3 style={{marginTop:"4rem"}}>
                    Loading......
                </h3>
            :

            !nftData?
            <h3 style={{marginTop:"4rem"}}>
               Please connect to the Rinkeby network <br/><br/>

               <button onClick={instantiateContract}>
                   Connect to wallet
               </button>
               
            </h3>
            :
            <div style={{ padding:"2rem", fontSize:"18px"}}>
                    <div >

                        <b style={{fontSize:"25px"}}>Current Supply: {nftData &&`${nftData.totalSupply} / ${nftData.maxSupply}`} </b> <br/><br/>
                        <b>Cost of minting 1 JHK: {nftData && nftData.cost &&  web3.utils.fromWei((nftData.cost).toString(),'ether')} eth </b> <br/><br/>
                        <b>Maximum JHK to  mint at a time: {nftData && nftData.maxMintAmount} </b> <br/><br/>
                        
                        <b>Maximum JHK to be minted from a wallet: {nftData && nftData.maxAmountForAnAccount} </b> <br/><br/>

                        <b>You have minted: {nftData && nftData.myWallet} JHK </b> <br/><br/>

                    {
                        account.toUpperCase()==nftData.ownerAddress.toUpperCase() &&
                        <div>
                            <b>
                                Add Address to whitelist
                            </b>
                            <br/><br/>
                            <input value={addressToAdd} onChange={(e)=>changeAddress(e.target.value)} placeholder='Add address to whitelist' style={{padding:"0.5rem", width:"300px",height:"20px"}}>

                            </input>
                            <br/><br/>
                            <button  onClick={addAddress} style={{width:"150px", fontSize:"18px",padding:"0.45rem"}}>
                                Add Address 
                            </button><br/><br/>
                        </div>
                    }

                            <input type="number" value={number} onChange={(e)=>changeNumber(e.target.value)} placeholder='Number of NFTs you want to mint' style={{padding:"0.5rem", width:"300px",height:"20px"}}>

                            </input>
                            <br/><br/>
                            <button disabled={(!(number>0 && number <=5)) || loading} onClick={mintNFTs} style={{width:"150px", fontSize:"18px",padding:"0.45rem"}}>
                                Mint 
                            </button>

                    </div>
            </div>
        }
               
                
        </div>
    </div>
  )
}

export default App