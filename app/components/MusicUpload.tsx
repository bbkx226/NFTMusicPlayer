import AWS from "aws-sdk";
import React, { ChangeEvent, FormEvent, useState } from "react";

// Initialize S3
AWS.config.update({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID_ENV,
  region: "ap-southeast-1",
  secretAccessKey: process.env.NEXT_PUBLIC_SECRET_ACCESS_KEY_ENV
});

const s3 = new AWS.S3();

const MusicUpload = () => {
  const [artistName, setArtistName] = useState<string>("");
  const [songName, setSongName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_ENV || "";

  const uploadFileToS3 = async (file: Blob | File, fileName: string) => {
    const params = {
      Body: file,
      Bucket: bucketName,
      Key: fileName
    };

    try {
      await s3.upload(params).promise();
      console.log(`File uploaded successfully at ${fileName}`);
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

    // Upload the music file
    const musicFileName = `songs/${songName.replace(/\s+/g, "_")}-${Date.now()}`;
    await uploadFileToS3(file, musicFileName);

    // Create and upload metadata JSON
    const metadata = { artistName, price, songName };
    const metadataFileName = `database/${songName.replace(/\s+/g, "_")}-${Date.now()}.json`;
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
