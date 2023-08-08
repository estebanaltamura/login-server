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
    password: password
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

const addContentLike = async (projectCollection, docId, isFirstContentLiked, contentType, contentId)=>{
  const docRef = firestore.collection(projectCollection).doc(docId);  
  
  if(isFirstContentLiked === true){
    const contentyLikedValue = contentType === 'movie' ? {'movies': [contentId], 'tv-series': []} : {'movies': [], 'tv-series': [contentId]}

    try {
      await docRef.update({ ['contentLiked']:  contentyLikedValue});  
      console.log('doc updated')  
    } 
    catch (error) {
      console.error("Error updating document: ", error);
    }
  } 

  else{
    const docSnapshot = await docRef.get();
    const contentLikedValue = docSnapshot.data().contentLiked

    contentType === 'movie' && contentLikedValue.movies.push(contentId)
    contentType === 'tv' && contentLikedValue.tv-series.push(contentId)    

    try {
      await docRef.update({ ['contentLiked']:  contentLikedValue});  
      console.log('doc updated')  
    } 
    catch (error) {
      console.error("Error updating document: ", error);
    }
  }  
}


const hasContentLiked = async (projectCollection, docId) => {
  const docRef = firestore.collection(projectCollection).doc(docId);
  
  const docSnapshot = await docRef.get();

  if (docSnapshot.exists) {
    return docSnapshot.data().contentLiked !== undefined ? true : false; 
  } else {
    console.log("Document does not exist");
    return null;
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

  const { userName, password } = getUserNameAndPasswordFromToken(token)
  const docId = await getDocIdFromUserNameAndPassword(projectCollection, userName, password)

  const hasContentLikedResult = await hasContentLiked(projectCollection, docId)

  
  await addContentLike(projectCollection, docId, !hasContentLikedResult, contentType, contentId)
  


  

  


  
  
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

