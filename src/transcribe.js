'use strict';

const awsSdk = require('aws-sdk');
const localstackHost = `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`
const endpoint = new awsSdk.Endpoint(localstackHost);
const endpointConfig = new awsSdk.Config({
  endpoint: endpoint
});

const transcribeService = new awsSdk.TranscribeService(endpointConfig);

// This function is triggered by an S3 event.
// It starts a transcription job given an audio file.
module.exports.process = (event, context, callback) => {
  const records = event.Records;
  console.log("Processing records: ", records);

  const transcribingPromises = records.map((record) => {
    const TranscriptionJobName = record.s3.object.key;

    // Start Transcription Job
    return transcribeService.startTranscriptionJob({
      LanguageCode: process.env.LANGUAGE_CODE,
      Media: {
        MediaFileUri: `s3://${process.env.S3_AUDIO_BUCKET}/${record.s3.object.key}`  // s3 media file uri
      },
      MediaFormat: 'wav',
      TranscriptionJobName,
      MediaSampleRateHertz: 8000, // normally 8000 if you are using wav file
      OutputBucketName: process.env.S3_TRANSCRIPTION_BUCKET, // s3 bucket to store the transcription result
    }).promise();
  });

  Promise.all(transcribingPromises)
    .then(() => {
      callback(null, { message: 'Start transcription job successfully' });
    })
    .catch(err => callback(err, { message: 'Error start transcription job' }));
};
