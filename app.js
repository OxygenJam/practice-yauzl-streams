const 
    streams = require('node:stream'),
    yauzl = require('yauzl'),
    fs = require('fs');
    yazl = require('yazl');

const outPutFile = new yazl.ZipFile();
yauzl.open('./sample_file/sample_file.zip',{ lazyEntries: true }, (err, zipFile) =>{
    if(err) throw err;

    zipFile.readEntry();
    zipFile.on("entry", function(entry) {
        if (/\/$/.test(entry.fileName)) {
            // Directory file names end with '/'.
            // Note that entries for directories themselves are optional.
            // An entry's fileName implicitly requires its parent directories to exist.
            zipFile.readEntry();
        } else {
            // file entry
            zipFile.openReadStream(entry, function(err, readStream) {
                if (err) throw err;
                const transformedStream = readStream.pipe(new EditorStream());
                readStream.on("end", function() {
                    zipFile.readEntry();
                    outPutFile.addReadStream(transformedStream, entry.fileName)
                });
            });
        }
    });

    zipFile.on('end', ()=>{
        zipFile.close();
        outPutFile.end();
    });
});

outPutFile.outputStream.pipe(fs.createWriteStream('./sample_file/sample_file_v2.zip')).on('close', ()=>{
    console.log('FINISHED OUTPUT')
});


class EditorStream extends streams.Transform {
    constructor(options){
        super(options);
    }

    _transform(data, encoding='utf8', callback){
        const myReg = /hello world/;

        const newData = (data.toString()).replace(myReg, 'foo bar');

        this.push(newData);
        callback();
    }
}