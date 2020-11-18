const AWS = require('aws-sdk');
const fs = require('fs');
const fileType = require('file-type');
const multiparty = require('multiparty');

const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_KEY,
});

module.exports = {
	uploadToS3,
	getUploadDataFromRequest,
};

function uploadToS3(fileName, buffer, type) {
	const params = {
		ACL: 'public-read',
		Body: buffer,
		Bucket: process.env.S3_BUCKET,
		ContentType: type.mime,
		Key: `${fileName}.${type.ext}`,
	};
	return s3.upload(params).promise();
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

	const path = files.file[0].path;
	const buffer = fs.readFileSync(path);
	const type = await fileType.fromBuffer(buffer);

	return {
		name: fields.name[0],
		description: fields.description[0],
		buffer,
		type,
	};
}
