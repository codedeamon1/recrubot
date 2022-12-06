const path = require('path');
const { app, BrowserWindow, powerMonitor, Menu,  Tray, nativeImage, ipcMain } = require('electron');
const { autoUpdater } = require("electron-updater")

const url="http://192.168.31.55:3000/api/"
//const url=""
const keyword_extractor = require("keyword-extractor");//For keyword
const storage = require('electron-storage');
const AutoLaunch = require('auto-launch');
//let {PythonShell} = require('python-shell')
const exeName = path.basename(app.getPath('exe'));
console.log(__dirname)
  let autoLaunch = new AutoLaunch({
    name: 'Infoapto',
    path: app.getPath('exe'),
  });
  let win, tray;
  const createWindow = () => {
  const browserWindows = {};
  const { loadingWindow, mainWindow } = browserWindows;
 
    win = new BrowserWindow({
      width: 1000,
      height: 600,
      webPreferences: {
        nodeIntegration: true,                                                  //Creating app and its build to run!
        contextIsolation: false,
        enableRemoteModule: true,
      },
      autoHideMenuBar: false,
      icon: path.join(__dirname, 'infoaptoicon.png'),
    });

  win.once("ready-to-show", () => win.show());

  win.on("closed", () => (win = null));

  tray = new Tray(nativeImage.createEmpty());

  
  if(!app.isPackaged) {
  tray = new Tray('infoaptoicon.png');
  } else {
  tray = new Tray(path.join(__dirname, 'infoaptoicon.png'));
 
  }
  

  tray.setToolTip("Infoapto App");

  const contextMenu = Menu.buildFromTemplate([

    {

    label: "Show",

    type: "normal",

    click() {

      win.show();

    }

    } 


    
  ]);

  tray.on("click", () => (win.isVisible() ? win.hide() : win.show()));

  tray.setContextMenu(contextMenu);

  win.on("close", e => {

    if (win.isVisible()) {

    win.hide();

    e.preventDefault();

    }

  });


  


  win.loadFile(path.join(__dirname,'login.html'));
/**
   * @description - Function to use custom JavaSCript in the DOM.
   * @param {string} command - JavaScript to execute in DOM.
   * @param {function} callback - Callback to execute here once complete.
   * @returns {Promise}
   */ 
  
 const executeOnWindow = (command, callback) => {
  return mainWindow.webContents.executeJavaScript(command)
    .then(callback)
    .catch(console.error);
};
  };
  app.on("ready", ()=>{
    autoLaunch.enable();
    if (win == null) createWindow();
  
  }
   
);

 

  app.on("activate", () => {

  if (win == null) createWindow();

  });

 

  app.on("window-all-closed", () => {
   
  if (process.playform !== "darwin") app.quit();

  });

 

  ipcMain.on("asynchronous-message", (event, arg) => {
  if (arg === "tray") win.hide();

  if (arg === "quit") app.quit();

  });

function showMainWindow() {
  var fs = require('fs');
  const createDesktopShortcut = require('create-desktop-shortcuts');
  var path = require('path');
  //var dir = 'beforeupload';
  var afterupliad_dir = 'my_resumes';
 
if (!fs.existsSync(path.join(__dirname,afterupliad_dir))){
    var x = path.join(__dirname,afterupliad_dir);
    fs.mkdirSync(x);
    const shortcutsCreated = createDesktopShortcut({
      windows: { filePath: x },
    })
 
  }
  win.loadFile(path.join(__dirname,'index.html')) // For testing purposes only
  .then(() => { win.show(); })
  
  
  /*
  storage.get("newfile", (err, data) => {
    let options = {
      args: data.userid
  };
    if (err) {
      console.error(err)
    } else {
        mydir=path.join(path.join(__dirname,'app.py'))
        console.log(mydir)
        PythonShell.run(mydir, options, function (err) {
        if (err) throw err;
        });
    }
  });
  */

}



function showLoginWindow() {
win.loadFile(path.join(__dirname,'login.html'))
.then(() => { win.show(); })
}
ipcMain.on('message:loginShow', (event) => {
  showLoginWindow();
})


function pdfreader (filename,path,userid,token,storage,companyID)  {               //Reading pdf files
  const fs = require('fs')
  var https=require('https')
  var mypath=require('path')
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    cert: fs.readFileSync(mypath.join(__dirname,'ca.crt')),
  });

  console.log('pdfreader')
  
  const axios=require('axios')
const pdfParse = require('pdf-parse')

  const getPDF = async (file) => {
    let readFileSync = fs.readFileSync(file)
    try {
      let pdfExtract = await pdfParse(readFileSync)
      var textdata=await keyword_extractor.extract(pdfExtract.text,{//For keyword
        language:"english",
        remove_digits: false,
        return_changed_case:false,
        return_chained_words:true,
        remove_duplicates:true,
    });
   // var mystr=""
   var mystr=textdata.toString();
   var candidate_email= await pdfExtract.text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);//For Email extraction
        console.log(candidate_email);
        if(candidate_email&&candidate_email.length>=1){
            email=candidate_email[0]
            candidate_mobile=await pdfExtract.text.match(/[\+]?\d{10}|\(\d{3}\)\s?-\d{6}/);//For mobilenumber extraction if email exist 
            if(candidate_mobile&&candidate_mobile>=1){
                mobilnum=candidate_mobile[0]
            }
            else{
                mobilnum="None";
            }
        }
        else{
            email=""
            mobilnum="None";
        }

   if(mystr!=""&&email!=""){
    
    
                                                               //Saving the data in db if email exist and mobile is optional
      xdata={
              resumeName:filename,
              resumeText:mystr,
              mobileNo:mobilnum,
              email:email,
            }
            myconfig={
          method: 'post',
              url: url+'resume/addResume',
              httpsAgent : httpsAgent,
              headers: { 
                'Content-Type': 'application/json',
                'Authorization':token
                },
                data : xdata }
                axios(myconfig).then(async function(response){
                  if(response.data.status==true)
                  {
                    var binarydat=await fs.readFileSync(path)
                    const params = {
                        Bucket: "app-resumes"+"/"+"Resumes"+"/"+companyID,
                        Key: filename,
                        Body: binarydat,
                        ACL: 'public-read', 
                    }
                    storage.upload(params, async function (err, data) {                   //S3 upload function
                    if(err){
                      console.log(err);
                    }
                  })
                    console.log(response.data.message)
                    var oldpath=path
                    var newpath=mypath.join(__dirname,'my_resumes',filename)
                    var mv = require('mv');
 
                  mv(oldpath, newpath, function(err) {
                    if(err){
                      console.log(err);
                    }
                  });
                  }
                })
              
             
            }
            else{
              
              var oldpath=path
              var newpath=mypath.join(__dirname,'my_resumes',filename)
              var mv = require('mv');
    
              mv(oldpath, newpath, function(err) {
                if(err){
                  console.log(err);
                }
              });
            }
    } catch (error) {
      console.log(error);
    }
  }
  getPDF(path)
}
function docreader(filename,path,userid,token,storage,companyID)  {                                   //Reading doc files
  const fs = require('fs')
  var mypath=require('path')
  var https=require('https')
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    cert: fs.readFileSync(mypath.join(__dirname,'ca.crt')),
  });
 
  const axios=require('axios')
    try {
      
      const WordExtractor = require("word-extractor"); 
      const extractor = new WordExtractor();
      const extracted = extractor.extract(path);
      extracted.then(async function(doc) { 
        var textdata=await keyword_extractor.extract(doc.getBody(),{        //For keyword
          language:"english",
          remove_digits: false,
          return_changed_case:false,
          return_chained_words:true,
          remove_duplicates:true,
      });
      //var mystr=""
      var mystr=textdata.toString();
      var candidate_email= await doc.getBody().match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);//For Email extraction
      console.log(candidate_email);
      if(candidate_email&&candidate_email.length>=1){
          email=candidate_email[0]
          candidate_mobile=await doc.getBody().match(/[\+]?\d{10}|\(\d{3}\)\s?-\d{6}/);//For mobilenumber extraction if email exist
          if(candidate_mobile&&candidate_mobile>=1){
              mobilnum=candidate_mobile[0]
          }
          else{
            mobilnum="None";
          }
      }
      else{
          email=""
          mobilnum="None";
      }
      if(mystr!=""&&email!=""){
                       //Saving the data in db if email exist and mobile is optional
      xdata={
          resumeName:filename,
          resumeText:mystr,
          mobileNo:mobilnum,
          email:email,
        }
        myconfig={
      method: 'post',
          url: url+'resume/addResume',
          httpsAgent : httpsAgent,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization':token
            },
            data : xdata }
            axios(myconfig).then(async function(response){
              if(response.data.status==true)
              {
                var binarydat=await fs.readFileSync(path)
                  const params = {
                      Bucket: "app-resumes"+"/"+"Resumes"+"/"+companyID,
                      Key: filename,
                      Body: binarydat,
                      ACL: 'public-read', 
                  }
                  storage.upload(params, async function (err, data) {                   //S3 upload function
                  if(err){
                    console.log(err);
                  }
                })
                var oldpath=path
                var newpath=mypath.join(__dirname,'my_resumes',filename)
                var mv = require('mv');
 
                mv(oldpath, newpath, function(err) {
                  if(err){
                    console.log(err);
                  }
                });
              }
            })
      
      }
        else{
          
          var oldpath=path
          var newpath=mypath.join(__dirname,'my_resumes',filename)
          var mv = require('mv');

          mv(oldpath, newpath, function(err) {
            if(err){
              console.log(err);
            }
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
}



function docxreader(filename,path,userid,token,storage,companyID)  {                                    //Reading docx files
  const fs = require('fs')
  var mypath=require('path')
  var https=require('https')
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    cert: fs.readFileSync(mypath.join(__dirname,'ca.crt')),
  });
  

  const axios=require('axios')

var textract=require('textract');
textract.fromFileWithPath(path, async function( error, mytext) {
   if(!error){
    var textdata=await keyword_extractor.extract(mytext,{                             //For keyword
      language:"english",
      remove_digits: false,
      return_changed_case:false,
      return_chained_words:true,
      remove_duplicates:true,
  });
  //var mystr=""
  var mystr=textdata.toString();
  var candidate_email= await mytext.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);//For Email extraction
      console.log(candidate_email);
      if(candidate_email&&candidate_email.length>=1){
          email=candidate_email[0]
          candidate_mobile=await mytext.match(/[\+]?\d{10}|\(\d{3}\)\s?-\d{6}/);//For mobilenumber extraction if email exist
          if(candidate_mobile&&candidate_mobile>=1){
              mobilnum=candidate_mobile[0]
          }
          else{
             mobilnum="None";
          }
      }
      else{
          email=""
          mobilnum="None";
      }
  
  if(mystr!=""&&email!=""){
                                                            //Saving the data in db if email exist and mobile is optional
    xdata={
      resumeName:filename,
      resumeText:mystr,
      mobileNo:mobilnum,
      email:email,
    }
    myconfig={
  method: 'post',
      url: url+'resume/addResume',
      httpsAgent : httpsAgent,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization':token
        },
        data : xdata }
        axios(myconfig).then(async function(response){
          if(response.data.status==1)
          {
            var binarydat=await fs.readFileSync(path)
        const params = {
        Bucket: "app-resumes"+"/"+"Resumes"+"/"+companyID,
        Key: filename,
        Body: binarydat,
        ACL: 'public-read', 
    }
    storage.upload(params, async function (err, data) {                   //S3 upload function
    if(err){
      console.log(err);
    }
  })   
            console.log(response.data.message)
            var oldpath=path
            var newpath=mypath.join(__dirname,'my_resumes',filename)
            var mv = require('mv');
 
            mv(oldpath, newpath, function(err) {
              if(err){
                console.log(err);
              }
            });
          }
        })
  }
   else{
   
    var oldpath=path
    var newpath=mypath.join(__dirname,'my_resumes',filename)
    var mv = require('mv');

    mv(oldpath, newpath, function(err) {
      if(err){
        console.log(err);
      }
    });
  }
   }
 })
}


ipcMain.on('message:loginhide', (event, session) => {                 //Showing home page after login
  showMainWindow();
})

ipcMain.on('message:textread', async(event, session) => {                           //Reading the foled to get files for further process
  try{
  var fs=require('fs')
  var path=require('path')
  var https=require('https')
  const AWS = require('aws-sdk');
  var mydata=await storage.get("newfile")
  var x=mydata.downloadpath
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    cert: fs.readFileSync(path.join(__dirname,'ca.crt')),
  });
 
  await fs.readdir(x,(err,files)=>{
    //console.log(files.length)
    if(files.length>0){
    if(err){
      console.log(err);
    }
    else{
      event.sender.send('loader_start'); 
      var num=0;
      if(files.length>100){
        var mylength=100;
      }
      else{
        var mylength=files.length;
      }
      for(i=0;i<mylength;i++){
      console.log(files[i]);
      
      
      
      
      if(files[i].split('.').pop()=="doc"||files[i].split('.').pop()=="docx"||files[i].split('.').pop()=="pdf"){

        var element=files[i]
        var axios=require('axios')
        myconfig={
          method: 'post',
              url: url+'resume/checkResume',
              httpsAgent : httpsAgent,                                          //Checks the database to see if the file already exist
              headers: { 
                'Content-Type': 'application/json',
                'Authorization':mydata.token
                },
                data : {
                  resumeName:element,
                  path:path.join(x,element),
                  ext:element.split('.').pop()
                },
               
        }
        axios(myconfig).then(async response=>{
          //console.log(response.data.resumeName);
          
               
          if(response.data.status==true){
            num=i;
            if((num)==mylength){
              event.sender.send('loader_stop'); 
            }
            require('dotenv').config()
            const storage = new AWS.S3({
              accessKeyId: mydata.keyid,
              secretAccessKey: mydata.accesskey,
            })
              
                  //Sending file to each function according to type
                
            if(response.data.ext=="doc"){   
                  await docreader(response.data.resumeName,response.data.path,mydata.userid,mydata.token,storage,mydata.companyId)
            }
            
           
             if(response.data.ext=="docx"){      
                  await docxreader(response.data.resumeName,response.data.path,mydata.userid,mydata.token,storage,mydata.companyId)
            }
             
            else if(response.data.ext=="pdf"){
                  await pdfreader(response.data.resumeName,response.data.path,mydata.userid,mydata.token,storage,mydata.companyId)
            }
            
          }
          else{
            num=i;
            if(num==mylength){
              event.sender.send('loader_stop'); 
            }
            var oldpath=path.join(x,response.data.resumeName)
            var newpath=path.join(__dirname,'my_resumes',response.data.resumeName)
            var mv = require('mv');
 
            mv(oldpath, newpath, function(err) {
              if(err){
                console.log(err);
              }
            });
        
          }
          
        }).catch(err=>{
          console.log(err)
        }) 
        
      }
 
    }
    
  }
  }
  })
}
catch(e){
  console.log(e);
}
})





ipcMain.on('openFile', (event, id) => {                 //File directory selection
 

  const {dialog} = require('electron') 
  const fs = require('fs') 
  dialog.showOpenDialog(
    {
      title:'Open Dialogue',
      message:'First Dialog',
      //pass 'openDirectory' to strictly open directories
      properties: ['openDirectory']
    }
).then(result=>{
  
  const str = result.filePaths[0];

  event.sender.send('getData', str) 

})

  
  
 
})  