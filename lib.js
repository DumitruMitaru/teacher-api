const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_KEY,
	region: 'us-west-2',
});

const twilio = require('twilio')(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
);

module.exports = {
	deleteFromS3,
	getSignedUrlForS3,
	sendText,
};

async function getSignedUrlForS3(fileType) {
	const [type, subType] = fileType.split('/');
	const fileName = uuidv4() + '.' + subType;

	const signedUrl = await s3.getSignedUrlPromise('putObject', {
		Bucket: process.env.S3_BUCKET,
		Key: fileName,
		Expires: 60,
		ContentType: fileType,
		ACL: 'public-read',
	});

	return {
		signedUrl,
		uploadUrl: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${fileName}`,
	};
}

function deleteFromS3(url) {
	const fileName = url.split('/').pop();

	return s3
		.deleteObject({
			Bucket: process.env.S3_BUCKET,
			Key: fileName,
		})
		.promise();
}

function sendText(toPhoneNumber, message) {
	return twilio.messages.create({
		body: message,
		from: process.env.TWILIO_PHONE,
		to: toPhoneNumber,
	});
}
