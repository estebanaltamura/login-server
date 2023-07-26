const express = require('express');
const bodyParser = require('body-parser');
const jsonWebToken = require('jsonwebtoken')
const {Firestore} = require('@google-cloud/firestore');

const app = express();
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


app.post('/login', async(req, res) => {  
  const projectCollection = req.body.projectCollection 
  const userName          = req.body.userName;
  const password          = req.body.password;
  
  const isRegisteredUserResult = await isRegisteredUser(projectCollection, userName, password) 
  
  if(isRegisteredUserResult){
    const token = jsonWebToken.sign({ userName, password }, privateKey); 
    res.status(200).json({ message: "User logged", "token": token });     
  }
  else  res.status(404).json({ message: "User not found" });
});


app.post('/registerUser', async(req, res) => {
  const projectCollection = req.body.projectCollection 
  const userName          = req.body.userName;
  const password          = req.body.password;
  
  const isUniqueUserNameResult = await isUniqueUserName(projectCollection, userName)  
  
  if(isUniqueUserNameResult){    
    await addNewUser(projectCollection, userName, password)
    res.status(201).json({ message: "User successfully created" });
  } 
  else{
    res.status(409).json({ message: "Username is already taken" });
  }   
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

