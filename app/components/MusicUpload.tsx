import AWS from "aws-sdk";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface S3Props {
  s3: AWS.S3;
}

const MusicUpload: React.FC<S3Props> = ({ s3 }) => {
  const [artistName, setArtistName] = useState<string>("");
  const [songName, setSongName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
      console.log(`File uploaded successfully at ${fileName}`);
      setUploadSuccess(true);
      return `https://${params.Bucket}.s3.ap-southeast-1.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error("Error uploading file: ", error);
    }
  };

  const validateInputs = () => {
    return artistName.trim() !== "" && songName.trim() !== "" && price.trim() !== "" && file !== null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      console.error("File is not selected");
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
    const jsonFiles = await listS3Objects("database/");
    const jsonFileCount = jsonFiles.length;
    const tokenId = jsonFileCount;

    const randomNumber = Math.floor(Math.random() * 10000);

    // Step 2: Replace the number in the URL
    const baseUrl = "https://cryptopunks.app/cryptopunks/cryptopunk";
    const newUrl = `${baseUrl}${randomNumber}.png`;

    // Upload the music file and get the S3 URL
    const musicFileName = `songs/${songName.replace(/\s+/g, "_")}-${Date.now()}`;
    const songUrl = await uploadFileToS3(file, musicFileName);

    const metadata = {
      artist: artistName,
      audio: songUrl,
      icon: newUrl,
      name: songName,
      price: price,
      tokenId: tokenId
    };
    const metadataFileName = `database/${tokenId}.json`;
    await uploadFileToS3(new Blob([JSON.stringify(metadata)], { type: "application/json" }), metadataFileName);
  };

  useEffect(() => {
    if (uploadSuccess && validateInputs()) {
      setArtistName("");
      setSongName("");
      setPrice("");
      setFile(null);
      toast.success("🌌 File uploaded successfully! \nEnjoy your journey through the stars of music.", {
        duration: 4000,
        icon: "🚀",
        style: {
          background: "#333",
          color: "#fff"
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadSuccess]);

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
                if (!isNaN(Number(value)) || value === "") {
                  setPrice(value);
                } else {
                  toast.error("Please enter a numeric value. 🔢", {
                    duration: 1500,
                    style: {
                      background: "#333",
                      color: "#fff"
                    }
                  });
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files ? e.target.files[0] : null)}
              type="file"
            />
          </div>
          <button
            className="my-5 w-full flex justify-center bg-blue-500 text-gray-100 p-4 rounded-full tracking-wide font-semibold focus:outline-none focus:shadow-outline hover:bg-blue-600 shadow-lg cursor-pointer transition ease-in duration-300"
            type="submit"
          >
            Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default MusicUpload;
