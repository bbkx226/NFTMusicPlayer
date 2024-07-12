import AWS from "aws-sdk";
import { ethers } from "ethers";
import React, { ChangeEvent, FormEvent, useRef, useState } from "react";
import { toast } from "react-hot-toast";

interface S3Props {
  blockchainContract: ethers.Contract;
  s3: AWS.S3;
}

const MusicUpload: React.FC<S3Props> = ({ blockchainContract, s3 }) => {
  const [artistName, setArtistName] = useState<string>("");
  const [songName, setSongName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Step 3: Clear the input
    }
  };

  const validateInputs = () => {
    return artistName.trim() !== "" && songName.trim() !== "" && price.trim() !== "" && file !== null;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && fileInputRef.current) {
      const pattern = /^[a-zA-Z0-9\-_.\\/: ]+$/;
      const isValidFileName = pattern.test(fileInputRef.current.value);
      if (isValidFileName) {
        setFile(e.target.files[0]);
      } else {
        toast.error(
          "Oops! Looks like your file name's playing a different tune 🎵. \n\nStick to letters, numbers, hyphens, space bar, and underscores, please! 🚀",
          {
            duration: 4000,
            icon: "⚠️",
            style: {
              background: "#333",
              color: "#fff"
            }
          }
        );
        fileInputRef.current.value = "";
      }
    }
  };

  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_ENV || "";

  async function listS3Objects(prefix: string): Promise<string[]> {
    const params = {
      Bucket: bucketName,
      Prefix: prefix
    };

    try {
      const data = await s3.listObjectsV2(params).promise();
      const jsonFiles = data.Contents?.filter(file => file.Key?.endsWith(".json")).map(file => file.Key!) || [];
      return jsonFiles;
    } catch (error) {
      console.error("Error listing S3 objects:", error);
      return [];
    }
  }

  const uploadFileToS3 = async (file: Blob | File, fileName: string) => {
    const params = {
      ACL: "public-read",
      Body: file,
      Bucket: bucketName,
      Key: fileName
    };

    try {
      await s3.upload(params).promise();
      setArtistName("");
      setSongName("");
      setPrice("");
      clearFileInput();
      setFile(null);

      toast.success("🌌 File uploaded successfully! \nEnjoy your journey through the stars of music.", {
        duration: 4000,
        icon: "🚀",
        style: {
          background: "#333",
          color: "#fff"
        }
      });

      return `https://${params.Bucket}.s3.ap-southeast-1.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error("Error uploading file: ", error);
    }
  };

  async function updateContractWithNewPrice(newPrice: string) {
    try {
      const priceInWei = ethers.utils.parseEther(newPrice);
      await (await blockchainContract.addNewPrice(priceInWei)).wait();
      const items = await blockchainContract.getMarketItemList();
      console.log("Market Items:", items); // NOTE: For Debugging Purpose

      toast.success("Contract updated with new price!", {
        duration: 4000,
        icon: "🎉",
        style: {
          background: "#333",
          color: "#fff"
        }
      });
      return true;
    } catch (error) {
      console.log(error);
      toast.error(
        "Contract hiccup! \n\n🎶 Your music's still a hit. Upload again when you're ready to top the charts!",
        {
          duration: 4000,
          icon: "❌",
          style: {
            background: "#333",
            color: "#fff"
          }
        }
      );
      return false;
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (Number(price) <= 0 || Number(price) > 1000) {
      toast.error("Keep it cool and under 1000! Positive vibes only, please! 🔢✨", {
        duration: 1500,
        style: {
          background: "#333",
          color: "#fff"
        }
      });
      return;
    }

    if (!validateInputs()) {
      toast.error("Please fill in all fields. 📝", {
        duration: 4000,
        icon: "⚠️",
        style: {
          background: "#333",
          color: "#fff"
        }
      });
      return;
    }
    setIsUploading(true);

    const jsonFiles = await listS3Objects("database/");
    const jsonFileCount = jsonFiles.length;
    const tokenId = jsonFileCount;

    const result = await updateContractWithNewPrice(price);
    if (!result) {
      setIsUploading(false);
      return;
    }

    const randomNumber = Math.floor(Math.random() * 10000);

    // Step 2: Replace the number in the URL
    const baseUrl = "https://cryptopunks.app/cryptopunks/cryptopunk";
    const newUrl = `${baseUrl}${randomNumber}.png`;

    // Upload the music file and get the S3 URL
    const musicFileName = `songs/${songName.replace(/\s+/g, "_")}-${Date.now()}`;
    const songUrl = await uploadFileToS3(file as Blob, musicFileName);

    const metadata = {
      artist: artistName,
      audio: songUrl,
      icon: newUrl,
      name: songName,
      price: price,
      tokenId: tokenId
    };
    const metadataFileName = `database/${tokenId.toString().padStart(4, "0")}.json`;

    try {
      await uploadFileToS3(new Blob([JSON.stringify(metadata)], { type: "application/json" }), metadataFileName);
    } catch (error) {
      toast.error("AWS S3 is unreachable, please try again later. 🔄", {
        duration: 4000,
        icon: "⚠️",
        style: {
          background: "#333",
          color: "#fff"
        }
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-fit" style={{ backgroundColor: "#0a0a0a" }}>
      <div className="z-10 w-full max-w-sm p-10 m-4 bg-white rounded-xl sm:m-0 sm:max-w-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Music Upload!</h2>
          <p className="mt-2 text-sm text-gray-400">
            🎶 Unleash your musical talent and share your masterpiece with the world! 🌎✨
          </p>{" "}
        </div>
        <form className="mt-8 space-y-3" id="music-upload" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 space-y-2">
            <label className="text-sm font-bold text-gray-500 tracking-wide">Artist Name</label>
            <input
              className="text-gray-900 text-base p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setArtistName(e.target.value)}
              placeholder="Artist Name"
              type="text"
              value={artistName}
            />
          </div>
          <div className="grid grid-cols-1 space-y-2">
            <label className="text-sm font-bold text-gray-500 tracking-wide">Song Name</label>
            <input
              className="text-gray-900 text-base p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSongName(e.target.value)}
              placeholder="Song Name"
              type="text"
              value={songName}
            />
          </div>
          <div className="grid grid-cols-1 space-y-2">
            <label className="text-sm font-bold text-gray-500 tracking-wide">Price in ETH</label>
            <input
              className="text-gray-900 text-base p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                // Allow only numeric input
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value)) {
                  setPrice(value);
                }
              }}
              placeholder="Price in ETH"
              type="text"
              value={price}
            />
          </div>
          <div className="grid grid-cols-1 space-y-2">
            <label className="text-sm font-bold text-gray-500 tracking-wide">Attach Audio File</label>
            <input
              accept="audio/mp3, audio/wav, audio/ogg, audio/mpeg, audio/aac, audio/flac, audio/mp4, audio/x-aiff"
              className="text-base text-gray-500 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
          </div>
          <button
            className="my-5 w-full flex justify-center bg-gray-600 text-gray-100 p-4 rounded-full tracking-wide font-semibold focus:outline-none focus:shadow-outline hover:bg-gray-500 shadow-lg cursor-pointer transition ease-in duration-300"
            type="submit"
          >
            {isUploading ? "Harmonizing the Blockchain 🎵⛓" : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MusicUpload;
