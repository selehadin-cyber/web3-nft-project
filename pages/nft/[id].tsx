import React, { useState, useEffect } from 'react'
import {
  useAddress,
  useDisconnect,
  useMetamask,
  useNFTDrop,
} from '@thirdweb-dev/react'
import { GetServerSideProps } from 'next'
import { sanityClient, urlFor } from '../../sanity'
import { Collection } from '../../typings'
import Link from 'next/link'
import { BigNumber } from 'ethers'
import toast, { Toaster } from "react-hot-toast" 

interface Props {
  collection: Collection
}

function NFTDropPage({ collection }: Props) {
  const [claimedSupply, setClaimedSupply] = useState<number>(0)
  const [totalSupply, setTotalSupply] = useState<BigNumber>()
  const [loading, setLoading] = useState(true)
  const [priceInEth, setPriceInEth] = useState<string>()
  const nftDrop = useNFTDrop(collection.address)

  //auth
  const connectWithMetamask = useMetamask()
  const address = useAddress()
  const disconnect = useDisconnect()
  // ---

  useEffect(() => {
    if (!nftDrop) return
    const fetchPrice = async() => {
      const claimConditions = await nftDrop.claimConditions.getAll();
      setPriceInEth(claimConditions?.[0].currencyMetadata.displayValue)
    }
    fetchPrice();
  }, [nftDrop])

  useEffect(() => {
    if (!nftDrop) return

    const fetchNFTDropData = async () => {
      setLoading(true)

      const claimed = await nftDrop.getAllClaimed()
      const total = await nftDrop.totalSupply()
      setClaimedSupply(claimed.length)
      setTotalSupply(total)

      setLoading(false)
    }
    fetchNFTDropData()
  }, [nftDrop]);

  const mintNFT = () => {
    if (!nftDrop || !address) return;
    const quantity = 1;
    setLoading(true);
    const notification = toast.loading("Minting...", {
      style: {
        background: "white",
        color: "green",
        fontWeight: "bolder",
        fontSize: "17px",
        padding: "20px"
      }
    })

    nftDrop.claimTo(address, quantity).then(async (tx) => {
      const reciept = tx[0].receipt;
      const claimedTokenId = tx[0].id;
      const claimedNFT = await tx[0].data();

      toast("Well done 👏 you minted successfully!", {
        duration: 8000,
        style: {
          background: "green",
          color: "white",
          fontWeight: "bolder",
          fontSize: "17px",
          padding: "20px"
        }
      })

      console.log(reciept);
      console.log(claimedTokenId);
      console.log(claimedNFT);
    })
    .catch((err) => {
      console.log(err)
      toast("Whoops something went wrong🤔", {
        style: {
          background: "red",
          color: "white",
          fontWeight: "bolder",
          fontSize: "17px",
          padding: "20px"
        }
      })
    })
    .finally(() => {
      setLoading(false);
      toast.dismiss(notification)
    })
  }

  return (
    <div className="flex h-screen flex-col lg:grid lg:grid-cols-10">
      <Toaster position='bottom-center'/>
      {/* left */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-cyan-800 to-rose-500 py-2 lg:col-span-4 lg:min-h-screen">
        <div className="to-puple-600 rounded-xl bg-gradient-to-br from-yellow-400 p-2">
          <img
            className="w-44 rounded-xl object-cover lg:h-96 lg:w-72"
            src={urlFor(collection.previewImage).url()}
            alt="circuit"
          />
        </div>
        <div className="space-y-2 p-5 text-center">
          <h1 className="text-4xl font-bold text-white">
            {collection.nftCollectionName}
          </h1>
          <h2 className="text-xl text-gray-300">{collection.description}</h2>
        </div>
      </div>
      {/* right */}
      <div className="p-12 lg:col-span-6">
        {/* header */}
        <header className="flex items-center justify-between">
          <Link href={'/'}>
            <p className="w-52 cursor-pointer text-xl font-extralight sm:w-80">
              {' '}
              The{' '}
              <span className="font-extrabold underline decoration-pink-600/50">
                Web3
              </span>{' '}
              NFT Marketplace
            </p>
          </Link>
          <button
            onClick={() => (address ? disconnect() : connectWithMetamask())}
            className="rounded-full bg-rose-400 px-4 py-2 text-xs font-bold text-white lg:px-5 lg:py-3 lg:text-base"
          >
            {address ? 'Sign out' : 'Sign in'}
          </button>
        </header>
        <hr className="my-2 border" />
        {address && (
          <p className="text-center text-sm text-rose-400">
            You are logged in with wallet {address.substring(0, 5)}...
            {address.substring(address.length - 5)}
          </p>
        )}
        {/* content */}
        <div className="mt-10 flex flex-1 flex-col items-center space-y-6 text-center lg:justify-center lg:space-y-0">
          <img
            className="w-80 object-cover pb-10 lg:h-40"
            src={urlFor(collection.mainImage).url()}
            alt=""
          />
          <p className="text-3xl font-bold lg:text-5xl lg:font-extrabold">
            {collection.title}
          </p>
          {loading ? (
            <p className="animate-pulse pt-2 text-xl text-green-500">
              loading...
            </p>
          ) : (
            <p className="pt-2 text-xl text-green-500">
              {claimedSupply}/ {totalSupply?.toString()} NFT's claimed
            </p>
          )}
          {loading && (
            <img
              className="h-80 w-80 object-contain"
              src="https://cdn.hackernoon.com/images/0*4Gzjgh9Y7Gu8KEtZ.gif"
              alt="loading"
            />
          )}
        </div>
        {/* mint button */}
        <button
          onClick={mintNFT}
          disabled={
            loading || claimedSupply === totalSupply?.toNumber() || !address
          }
          className="mt-10 h-16 w-full rounded-full bg-red-600 font-bold text-white disabled:bg-gray-400"
        >
          {loading ? (
            <>Loading</>
          ) : claimedSupply === totalSupply?.toNumber() ? (
            <>Loading</>
          ): !address ? (
            <>Sign in to mint</>
          ):  <span className='font-bold'>Mint NFT ({priceInEth}) ETH</span> }
         
        </button>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const query = `*[_type == "collection" && slug.current == $id][0] {
    _id,
    title,
    address,
    description,
    nftCollectionName,
    mainImage {
    asset
    },
    previewImage {
    asset
    },
    slug {
    current
    },
    creator-> {
    _id,
    name,
    address,
    slug {
    current
    },
    },
    }`

  const collection = await sanityClient.fetch(query, {
    id: params?.id,
  })

  if (!collection) {
    return {
      notFound: true,
    }
  }
  return {
    props: {
      collection,
    },
  }
}

export default NFTDropPage
