import multer from "multer";

//cb => means callback
//diskStorage => lets you configure where and how multer will store uploaded file on the disk
const storage = multer.diskStorage({
  //destination=> folder where the uploaded fiels will be saved.
  destination: function (req, file, cb) {//e file multer ki paas hota hai 
      cb(null, "./public/temp")//I will keep all files in public folder that we can easily access them
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
    //This means that if a file named example.txt is uploaded, it will be stored in the public/temp directory with the same name, example.txt.
  })
  
export const upload = multer({ storage })
//we will use this as a middleware
//middleware is in between the routes and controllers



/*
memoryStorage():
i. alternative storage engine
ii. it keeps the files in memory (i.e., as Buffer objects) rather than saving them directly to the file system.

iii. This can be useful when you need to process or manipulate files before saving them to a database, sending them to another service, or handling them in some other way.

iv. Unlike diskStorage(), memoryStorage() does not create physical files on the server.

v. Since files are stored in memory, it’s generally suitable for small file uploads. Large files can quickly consume server memory and lead to performance issues or crashes.

Use cases:
1.image processing => like resizing, compressing
2.streaming files
3.temporary files

this is the code for memory storage:

import multer from 'multer';
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });
*/


/*
When to memoryStorage():
1.For immediate file processing

2.If the file is not meant to be stored permanently and only needs to be held temporarily in memory before being sent elsewhere (e.g., to another API or cloud storage), memoryStorage() is appropriate.

3. If you are dealing with small files that won’t consume too much server memory, memoryStorage() can be efficient and fast

4.If you are concerned about sensitive data being written to disk, using memoryStorage() ensures that the data stays in memory and is not stored on the server's file system.

5.When building stateless services where files are processed and then immediately discarded, memoryStorage() fits well since no data is persisted.



When to use diskStorage():
1. Files are large eg. videos, large images etc
2. When you need to store files permanently or semi-permanently on the server, diskStorage() is the right choice.

3. For applications that handle many simultaneous uploads, storing files on disk helps manage memory usage more effectively.
Example: An application that allows users to upload files concurrently, such as a file-sharing platform.
  
4. Disk storage provides a simple way to back up uploaded files and recover them if needed. If the server restarts or crashes, files stored on disk remain accessible.

5. If you plan to process files later (e.g., in a background job or another process), storing them on disk first can be more practical.

6. If you plan to process files later (e.g., in a background job or another process), storing them on disk first can be more practical.

*/