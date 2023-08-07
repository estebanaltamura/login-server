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
  keyFilename: '/home/ubuntu/projects/login-server/login-7e24a-firebase-adminsdk-tbg0z-3d702abca0.json',
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
  await userCollection.add(newUser);  
}

const getUserNameFromToken = (token) =>{
  try {
    const decodedToken = jsonWebToken.verify(token, privateKey);
    return decodedToken.userName;
  } catch (error) {    
    console.error("Error al verificar el token:", error.message);
    return false;
  }
}



app.post('/login', async(req, res) => {  
  const projectCollection = req.body.projectCollection 
  const userName          = req.body.userName;
  const password          = req.body.password;

  console.log(projectCollection, userName, password)

  if( typeof projectCollection === 'string' && 
      projectCollection !== undefined && 
      projectCollection !== "" &&   
      typeof userName === 'string' && 
      userName !== undefined && 
      userName !== "" &&   
      typeof password === 'string' &&
      password !== undefined  && 
      password !== ""){
        const isRegisteredUserResult = await isRegisteredUser(projectCollection, userName, password)
        if(isRegisteredUserResult){
          const token = jsonWebToken.sign({ userName, password }, privateKey); 
          res.status(200).json({ message: "User logged", "token": token });     
        }
        else res.status(404).json({ message: "Wrong username or password"});
      }
  else{res.status(400).json({ message: "Bad request. The parameters must be string and they mustn't be empty values"})}
  
});


app.post('/registerUser', async(req, res) => {
  const projectCollection = req.body.projectCollection 
  const userName          = req.body.userName;
  const password          = req.body.password;

  if( typeof projectCollection === 'string' && 
  projectCollection !== undefined && 
  projectCollection !== "" &&   
  typeof userName === 'string' && 
  userName !== undefined && 
  userName !== "" &&   
  typeof password === 'string' &&
  password !== undefined  && 
  password !== ""){
    const isUniqueUserNameResult = await isUniqueUserName(projectCollection, userName)
    if(isUniqueUserNameResult){    
      await addNewUser(projectCollection, userName, password)
      res.status(201).json({ message: "User successfully created" });
    } 
    else{
      res.status(409).json({ message: "Username is already taken" });
    }   
  }
  else{res.status(400).json({ message: "Bad request. The parameters must be string and they mustn't be empty values"})}
})   

app.post('/like', async(req, res) => {
  const contentType             = req.body.contentType;
  const contentId               = req.body.contentId;
  const token                   = req.body.token;
  const projectCollection       = req.body.projectCollection 

  const querySnapshot = await firestore.collection(projectCollection).get();

  console.log(querySnapshot)
})


//recibo . busco y escribo o busco y elimino
// setContentLiked(contentType, contentId, token, projectCollection){
  
  // const docRef = getUserNameFromToken(token)
  // const docRef = 

  // return //objeto con dos arrays
// }
//la respuesta de ese post se refleja en una actualizacion del estado de los arrays de contenidos likeados

const options = {
  key: fs.readFileSync('/etc/cert/privkey.pem'),
  cert: fs.readFileSync('/etc/cert/cert.pem')
};

const server = https.createServer(options, app);
const port = 3100






server.listen(port, () => {
  console.log(`Servidor HTTPS escuchando en el puerto ${port}`);
});

