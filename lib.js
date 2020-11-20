const AWS = require('aws-sdk');
const fs = require('fs');
const fileType = require('file-type');
const multiparty = require('multiparty');

const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_KEY,
});

module.exports = {
	deleteFromS3,
	getUploadDataFromRequest,
	uploadToS3,
};

function uploadToS3(fileName, buffer, type, subType) {
	const params = {
		ACL: 'public-read',
		Body: buffer,
		Bucket: process.env.S3_BUCKET,
		ContentType: type,
		Key: `${fileName}.${subType}`,
	};
	return s3.upload(params).promise();
}

function deleteFromS3(fileName) {
	return s3
		.deleteObject({
			Bucket: process.env.S3_BUCKET,
			Key: fileName,
		})
		.promise();
}

async function getUploadDataFromRequest(req) {
	const parseForm = req =>
		new Promise((resolve, reject) => {
			const form = new multiparty.Form();

			form.parse(req, function (err, fields, files) {
				if (err) return reject(err);

				return resolve({ fields, files });
			});
		});

	const { fields, files } = await parseForm(req);

	let buffer;
	let type;
	let subType;

	if (files.file) {
		buffer = fs.readFileSync(files.file[0].path);

		const { mime } = await fileType.fromBuffer(buffer);
		[type, subType] = mime.split('/');
	}

	return {
		name: fields.name[0],
		description: fields.description[0],
		taggedStudents: JSON.parse(fields.taggedStudents[0]),
		buffer,
		type,
		subType,
	};
}
