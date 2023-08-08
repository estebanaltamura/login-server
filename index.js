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

const isRegisteredUser = async(projectCollection, userName, password) => {
  const usersRef = firestore.collection(projectCollection);  
  const query = usersRef.where('userName', '==', userName).where('password', '==', password);
  
  const querySnapshot = await query.get();
  return !querySnapshot.empty;
}

const isUniqueUserName = async(projectCollection, userName) => {
  const usersRef = firestore.collection(projectCollection);
  const query = usersRef.where('userName', '==', userName);
  
  const querySnapshot = await query.get();
  return querySnapshot.empty; 
}

const addNewUser = async (projectCollection, userName, password) => {
  const userCollection = firestore.collection(projectCollection);

  const newUser = {
    userName: userName,
    password: password,
    contentLiked: {'movies': [], 'tvSeries': []}
  }
  await userCollection.add(newUser);  
}


const getUserNameAndPasswordFromToken = (token) =>{
  try {
    const decodedToken = jsonWebToken.verify(token, privateKey);
    return { userName: decodedToken.userName, password: decodedToken.password };
  } catch (error) {    
    console.error("Error al verificar el token:", error.message);
    return false;
  }
}

const getDocIdFromUserNameAndPassword = async (projectCollection, userName, password)=>{ 
  const usersRef = firestore.collection(projectCollection);  
  const query = usersRef.where('userName', '==', userName).where('password', '==', password);    
  const querySnapshot = await query.get();
  
  if (querySnapshot.empty) {
    return null; 
  } else {      
    return querySnapshot.docs[0].id;
  }  
}

const getContentLikedData = async (projectCollection, docId)=>{
  const docRef = firestore.collection(projectCollection).doc(docId);     
  const docSnapshot = await docRef.get();    
  const docSnapshotData = docSnapshot.data()
  const contentLikedValue = docSnapshotData.contentLiked
  return contentLikedValue 
}

const setContentLikedData = async (projectCollection, docId, updatedData)=>{  
  try{
  const docRef = firestore.collection(projectCollection).doc(docId);     
  await docRef.update(updatedData);
    console.log('Documento actualizado exitosamente');
  } 

  catch (error) {
    console.error('Error al actualizar el documento:', error);
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

app.post('/getContentLikedData', async(req, res) => {  
  const token                   = req.body.token;
  const projectCollection       = req.body.projectCollection 

  const { userName, password } = getUserNameAndPasswordFromToken(token)
  const docId = await getDocIdFromUserNameAndPassword(projectCollection, userName, password)
  
  const contentLikedData = await getContentLikedData(projectCollection, docId) 

  res.status(200); 
})

app.post('/setContentLikedData', async(req, res) => {  
  const token                   = req.body.token;
  const projectCollection       = req.body.projectCollection 
  const updatedData             = eq.body.updatedData 

  const { userName, password } = getUserNameAndPasswordFromToken(token)
  const docId = await getDocIdFromUserNameAndPassword(projectCollection, userName, password)
  
  const contentLikedData = await setContentLikedData(projectCollection, docId, updatedData) 

  res.status(200); 
})




projectCollection, docId, updatedData


const options = {
  key: fs.readFileSync('/etc/cert/privkey.pem'),
  cert: fs.readFileSync('/etc/cert/cert.pem')
};

const server = https.createServer(options, app);
const port = 3100


server.listen(port, () => {
  console.log(`Servidor HTTPS escuchando en el puerto ${port}`);
});

