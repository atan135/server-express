# Qiniu Utility Documentation

## Overview

The `QiniuUtil` class provides a comprehensive interface for interacting with Qiniu Cloud Storage (七牛云存储). It supports file upload, download, management, and various cloud storage operations.

## Features

- **File Upload**: Support for buffer, file path, and stream uploads
- **File Download**: Download files to local storage
- **File Management**: Copy, move, delete, and list files
- **URL Generation**: Generate public and private download URLs
- **Batch Operations**: Perform multiple operations in a single request
- **File Information**: Get file metadata, size, and MIME type
- **Cleanup Tools**: Remove old files based on age criteria
- **Error Handling**: Comprehensive error handling with detailed logging

## Installation

The Qiniu utility requires the `qiniu` package. Install it using:

```bash
npm install qiniu
```

## Configuration

### Initialize Qiniu

```javascript
const QiniuUtil = require('./src/utils/qiniu.util');

// Initialize with your Qiniu credentials
QiniuUtil.init({
  accessKey: 'your-access-key',
  secretKey: 'your-secret-key',
  bucket: 'your-bucket-name',
  domain: 'your-cdn-domain.com', // Optional
  region: 'z0', // Optional, default: 'z0'
  useHttps: true // Optional, default: true
});
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `accessKey` | string | Yes | - | Qiniu access key |
| `secretKey` | string | Yes | - | Qiniu secret key |
| `bucket` | string | Yes | - | Bucket name |
| `domain` | string | No | - | CDN domain for public URLs |
| `region` | string | No | 'z0' | Qiniu region |
| `useHttps` | boolean | No | true | Use HTTPS for URLs |

## Usage Examples

### File Upload

#### Upload from Buffer

```javascript
const buffer = Buffer.from('Hello, World!');
const result = await QiniuUtil.uploadBuffer(buffer, 'hello.txt');

console.log(result);
// {
//   success: true,
//   key: 'hello.txt',
//   hash: 'file-hash',
//   fsize: 13,
//   mimeType: 'text/plain',
//   url: 'https://your-domain.com/hello.txt'
// }
```

#### Upload from File Path

```javascript
const result = await QiniuUtil.uploadFile('/path/to/local/file.jpg', 'images/photo.jpg');

console.log(result);
// {
//   success: true,
//   key: 'images/photo.jpg',
//   hash: 'file-hash',
//   fsize: 1024000,
//   mimeType: 'image/jpeg',
//   url: 'https://your-domain.com/images/photo.jpg'
// }
```

#### Upload from Stream

```javascript
const fs = require('fs');
const stream = fs.createReadStream('/path/to/file.pdf');

const result = await QiniuUtil.uploadStream(stream, 'documents/file.pdf');
```

### File Download

```javascript
const result = await QiniuUtil.downloadFile('images/photo.jpg', '/local/path/photo.jpg');

console.log(result);
// {
//   success: true,
//   key: 'images/photo.jpg',
//   localPath: '/local/path/photo.jpg',
//   size: 1024000,
//   url: 'https://your-domain.com/images/photo.jpg'
// }
```

### File Management

#### Get File Information

```javascript
const info = await QiniuUtil.getFileInfo('images/photo.jpg');

console.log(info);
// {
//   success: true,
//   key: 'images/photo.jpg',
//   fsize: 1024000,
//   hash: 'file-hash',
//   mimeType: 'image/jpeg',
//   putTime: 1234567890,
//   url: 'https://your-domain.com/images/photo.jpg'
// }
```

#### Delete File

```javascript
const result = await QiniuUtil.deleteFile('images/photo.jpg');

console.log(result);
// {
//   success: true,
//   key: 'images/photo.jpg'
// }
```

#### Copy File

```javascript
const result = await QiniuUtil.copyFile('images/photo.jpg', 'backup/photo.jpg');

console.log(result);
// {
//   success: true,
//   sourceKey: 'images/photo.jpg',
//   targetKey: 'backup/photo.jpg',
//   url: 'https://your-domain.com/backup/photo.jpg'
// }
```

#### Move File (Rename)

```javascript
const result = await QiniuUtil.moveFile('images/photo.jpg', 'images/renamed-photo.jpg');

console.log(result);
// {
//   success: true,
//   sourceKey: 'images/photo.jpg',
//   targetKey: 'images/renamed-photo.jpg',
//   url: 'https://your-domain.com/images/renamed-photo.jpg'
// }
```

### List Files

```javascript
const result = await QiniuUtil.listFiles({
  prefix: 'images/',
  limit: 100,
  delimiter: '/'
});

console.log(result);
// {
//   success: true,
//   items: [
//     { key: 'images/photo1.jpg', fsize: 1024000, hash: 'hash1' },
//     { key: 'images/photo2.jpg', fsize: 2048000, hash: 'hash2' }
//   ],
//   marker: 'next-marker',
//   commonPrefixes: ['images/folder1/', 'images/folder2/'],
//   hasMore: true
// }
```

### URL Generation

#### Public URL

```javascript
const publicUrl = QiniuUtil.getPublicUrl('images/photo.jpg');
console.log(publicUrl); // https://your-domain.com/images/photo.jpg

// With custom options
const customUrl = QiniuUtil.getPublicUrl('images/photo.jpg', {
  domain: 'custom-domain.com',
  useHttps: false
});
console.log(customUrl); // http://custom-domain.com/images/photo.jpg
```

#### Private URL

```javascript
const privateUrl = QiniuUtil.generatePrivateUrl('private/document.pdf', {
  expires: 3600 // 1 hour
});
console.log(privateUrl); // https://your-domain.com/private/document.pdf?token=...
```

### Batch Operations

```javascript
const operations = [
  QiniuUtil.bucketManager.deleteOp('bucket', 'file1.txt'),
  QiniuUtil.bucketManager.deleteOp('bucket', 'file2.txt'),
  QiniuUtil.bucketManager.copyOp('bucket', 'source.txt', 'bucket', 'dest.txt')
];

const result = await QiniuUtil.batchOperations(operations);

console.log(result);
// {
//   success: true,
//   results: [
//     { code: 200, data: {} },
//     { code: 200, data: {} },
//     { code: 200, data: {} }
//   ],
//   operationCount: 3
// }
```

### File Utilities

#### Check if File Exists

```javascript
const exists = await QiniuUtil.fileExists('images/photo.jpg');
console.log(exists); // true or false
```

#### Get File Size

```javascript
const size = await QiniuUtil.getFileSize('images/photo.jpg');
console.log(size); // 1024000 (bytes)
```

#### Get File MIME Type

```javascript
const mimeType = await QiniuUtil.getFileMimeType('images/photo.jpg');
console.log(mimeType); // 'image/jpeg'
```

### Cleanup Old Files

```javascript
const result = await QiniuUtil.cleanupOldFiles({
  prefix: 'temp/',
  daysOld: 7, // Delete files older than 7 days
  limit: 100 // Process 100 files at a time
});

console.log(result);
// {
//   success: true,
//   totalDeleted: 25,
//   totalProcessed: 25,
//   daysOld: 7,
//   prefix: 'temp/'
// }
```

### Upload Token Generation

```javascript
// Generate token for specific file
const token = QiniuUtil.generateUploadToken({
  key: 'images/photo.jpg',
  expires: 3600
});

// Generate token for bucket (any file)
const bucketToken = QiniuUtil.generateUploadToken({
  expires: 7200
});

// Generate token with custom policy
const policyToken = QiniuUtil.generateUploadToken({
  key: 'images/photo.jpg',
  expires: 3600,
  policy: {
    returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":"$(fsize)"}',
    saveKey: '$(year)/$(mon)/$(day)/$(hour)/$(min)/$(sec)/$(etag)$(ext)'
  }
});
```

## Error Handling

All methods include comprehensive error handling and logging. Errors are thrown with descriptive messages:

```javascript
try {
  const result = await QiniuUtil.uploadFile('/path/to/file.jpg', 'images/photo.jpg');
  console.log('Upload successful:', result);
} catch (error) {
  console.error('Upload failed:', error.message);
  // Handle error appropriately
}
```

## Logging

The utility uses the project's logging system. All operations are logged with appropriate levels:

- **Info**: Successful operations
- **Warn**: Retry attempts, cleanup operations
- **Error**: Failed operations with error details

## Testing

Run the tests using Jest:

```bash
npm test qiniu.util.test.js
```

The test suite includes comprehensive coverage of all utility functions with mocked Qiniu SDK responses.

## Best Practices

1. **Initialize Once**: Call `QiniuUtil.init()` once at application startup
2. **Error Handling**: Always wrap operations in try-catch blocks
3. **File Naming**: Use meaningful file keys with proper directory structure
4. **Batch Operations**: Use batch operations for multiple file operations to improve performance
5. **Cleanup**: Regularly clean up old temporary files to manage storage costs
6. **URL Security**: Use private URLs for sensitive files
7. **Monitoring**: Monitor upload/download success rates and file sizes

## Common Use Cases

### Image Upload with Resize

```javascript
const sharp = require('sharp');

// Resize image before upload
const resizedBuffer = await sharp(inputBuffer)
  .resize(800, 600)
  .jpeg({ quality: 80 })
  .toBuffer();

const result = await QiniuUtil.uploadBuffer(resizedBuffer, 'images/resized-photo.jpg');
```

### File Backup

```javascript
// Copy important files to backup folder
const backupResult = await QiniuUtil.copyFile(
  'documents/important.pdf',
  `backup/${new Date().toISOString().split('T')[0]}/important.pdf`
);
```

### Temporary File Cleanup

```javascript
// Clean up temporary files older than 1 day
const cleanupResult = await QiniuUtil.cleanupOldFiles({
  prefix: 'temp/',
  daysOld: 1
});
```

## API Reference

### Static Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `init(options)` | Initialize Qiniu configuration | `{accessKey, secretKey, bucket, domain?, region?, useHttps?}` | `boolean` |
| `generateUploadToken(options?)` | Generate upload token | `{key?, expires?, policy?}` | `string` |
| `uploadBuffer(buffer, key, options?)` | Upload from buffer | `Buffer, string, Object?` | `Promise<Object>` |
| `uploadFile(filePath, key?, options?)` | Upload from file path | `string, string?, Object?` | `Promise<Object>` |
| `uploadStream(stream, key, options?)` | Upload from stream | `Stream, string, Object?` | `Promise<Object>` |
| `downloadFile(key, localPath, options?)` | Download file | `string, string, Object?` | `Promise<Object>` |
| `getFileInfo(key)` | Get file information | `string` | `Promise<Object>` |
| `deleteFile(key)` | Delete file | `string` | `Promise<Object>` |
| `copyFile(sourceKey, targetKey, options?)` | Copy file | `string, string, Object?` | `Promise<Object>` |
| `moveFile(sourceKey, targetKey, options?)` | Move/rename file | `string, string, Object?` | `Promise<Object>` |
| `listFiles(options?)` | List files | `{prefix?, marker?, limit?, delimiter?}` | `Promise<Object>` |
| `getPublicUrl(key, options?)` | Get public URL | `string, Object?` | `string` |
| `generatePrivateUrl(key, options?)` | Generate private URL | `string, Object?` | `string` |
| `batchOperations(operations)` | Batch operations | `Array` | `Promise<Object>` |
| `getBucketStats()` | Get bucket statistics | - | `Promise<Object>` |
| `fileExists(key)` | Check if file exists | `string` | `Promise<boolean>` |
| `getFileSize(key)` | Get file size | `string` | `Promise<number>` |
| `getFileMimeType(key)` | Get MIME type | `string` | `Promise<string>` |
| `cleanupOldFiles(options?)` | Cleanup old files | `{prefix?, daysOld?, limit?}` | `Promise<Object>` |

## Dependencies

- `qiniu`: Official Qiniu Node.js SDK
- `fs`: Node.js file system module
- `path`: Node.js path module
- `log4js`: Logging framework (project dependency)

## License

This utility is part of the express-mysql-project and follows the same license terms.
