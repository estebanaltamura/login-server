const fs            =require('fs')
const https         = require('https')
const express       = require('express');
const cors          = require('cors')
const bodyParser    = require('body-parser');
const jsonWebToken  = require('jsonwebtoken')
const {Firestore}   = require('@google-cloud/firestore');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const privateKey = "strongPassword" 

const firestore = new Firestore({
  projectId: 'login-7e24a',
  keyFilename: './login-7e24a-firebase-adminsdk-tbg0z-3d702abca0.json',
});



const isRegisteredUser = async(projectCollection, userName, password)=>{
  const querySnapshot = await firestore.collection(projectCollection).get(); 
  const isRegistered = querySnapshot.docs.some(doc => doc.data().userName === userName && doc.data().password === password);    
  return isRegistered
}

const isUniqueUserName = async(projectCollection, userName)=>{
  const querySnapshot = await firestore.collection(projectCollection).get(); 
  const isUniqueUserName = querySnapshot.docs.some(doc => doc.data().userName === userName);       
  return !isUniqueUserName
}

const addNewUser = async (projectCollection, userName, password) => {
  const userCollection = firestore.collection(projectCollection);

  const newUser = {
    userName: userName,
    password: password
  }
  const docRef = await userCollection.add(newUser);  
}

const areParametersOk = (projectCollection, userName, password)=>{  
  console.log("valores ingresado", projectCollection, userName, password)

  if(projectCollection !== undefined && userName !== undefined && password !== undefined){ 
    console.log("no son undefined")

    if(projectCollection === "" && userName === "" && password === ""){ 
      console.log("no son vacios")

      if(typeof projectCollection === 'string' && typeof userName === 'string' && typeof password === 'string'){
        console.log(typeof projectCollection, typeof userName, typeof password )
        console.log("son todos string")
            return true
      }
      else{
        console.log("no son undefined, no son vacios, pero no son string")
        return false
      } 
    }
    else {
      console.log("no son undefined, pero son valores vacios")
      return false
    }  
  }
  else{
    console.log("alguno es undefined")
    return false
  } 
}


app.post('/login', async(req, res) => {  
  const projectCollection = req.body.projectCollection 
  const userName          = req.body.userName;
  const password          = req.body.password;

  if(areParametersOk(projectCollection, userName, password)){
    const isRegisteredUserResult = await isRegisteredUser(projectCollection, userName, password) 
  
    if(isRegisteredUserResult){
      const token = jsonWebToken.sign({ userName, password }, privateKey); 
      res.status(200).json({ message: "User logged", "token": token });     
    }
    else res.status(404).json({ message: "User not found" });
  }
  else res.status(400).json({ message: "Bad request" });  
});


app.post('/registerUser', async(req, res) => {
  const projectCollection = req.body.projectCollection 
  const userName          = req.body.userName;
  const password          = req.body.password;
  
  if(areParametersOk(projectCollection, userName, password)){
    const isUniqueUserNameResult = await isUniqueUserName(projectCollection, userName)  
  
    if(isUniqueUserNameResult){    
      await addNewUser(projectCollection, userName, password)
      res.status(201).json({ message: "User successfully created" });
    } 
    else{
      res.status(409).json({ message: "Username is already taken" });
    }   
  }
  else res.status(400).json({ message: "Bad request" });
});

const options = {
  key: fs.readFileSync('/etc/cert/privkey.pem'),
  cert: fs.readFileSync('/etc/cert/cert.pem')
};

const server = https.createServer(options, app);

const port = 3100

server.listen(port, () => {
  console.log(`Servidor HTTPS escuchando en el puerto ${port}`);
});

