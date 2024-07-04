import AWS from "aws-sdk";
import React, { ChangeEvent, FormEvent, useState } from "react";

interface S3Props {
  s3: AWS.S3;
}

const MusicUpload: React.FC<S3Props> = ({ s3 }) => {
  const [artistName, setArtistName] = useState<string>("");
  const [songName, setSongName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
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
      return `https://${params.Bucket}.s3.ap-southeast-1.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error("Error uploading file: ", error);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      console.error("File is not selected");
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

  return (
    <form onSubmit={handleSubmit}>
      <input
        onChange={(e: ChangeEvent<HTMLInputElement>) => setArtistName(e.target.value)}
        placeholder="Artist Name"
        type="text"
        value={artistName}
      />
      <input
        onChange={(e: ChangeEvent<HTMLInputElement>) => setSongName(e.target.value)}
        placeholder="Song Name"
        type="text"
        value={songName}
      />
      <input
        onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
        placeholder="Price in ETH"
        type="text"
        value={price}
      />
      <input
        accept="audio/mp3, audio/wav, audio/ogg, audio/mpeg, audio/aac, audio/flac, audio/mp4, audio/x-aiff"
        onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files ? e.target.files[0] : null)}
        type="file"
      />
      <button type="submit">Upload</button>
    </form>
  );
};

export default MusicUpload;
