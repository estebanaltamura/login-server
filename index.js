const fs            = require('fs')
const fsAsync       = require('fs').promises
const https         = require('https')
const express       = require('express');
const cors          = require('cors')
const bodyParser    = require('body-parser');
const jsonWebToken  = require('jsonwebtoken')
const {Firestore}   = require('@google-cloud/firestore');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const firestore = new Firestore({
  projectId: 'login-7e24a',
  keyFilename: '/home/ubuntu/projects/login-server/login-7e24a-firebase-adminsdk-tbg0z-3d702abca0.json',
});

const encodeToken = async (userName, password)=>{
  try{
    const privateKey = await fsAsync.readFile('/ubuntu/home/projects/login-server/privateKey.txt', 'utf8')
    console.log(privateKey)
    const token = jsonWebToken.sign({ userName, password }, privateKey, { noTimestamp: true });  
    return token
  }
  catch(err){
    console.log(err)
    return false
  }  
}

const isRegisteredUser = async(projectCollection, token) => {
  const usersRef = firestore.collection(projectCollection);  
  const query = usersRef.where('token', '==', token);
  const querySnapshot = await query.get();
  return !querySnapshot.empty;
}

const addNewUser = async (projectCollection, token) => {
  const userCollection = firestore.collection(projectCollection);  

  const newUser = {
    token,    
    contentLiked: {'movies': [], 'tvSeries': [], 'allFavorites': []}
  }
  await userCollection.add(newUser);  
}


// const getUserNameAndPasswordFromToken = (token) =>{
//   try {
//     const decodedToken = jsonWebToken.verify(token, privateKey);
//     return { userName: decodedToken.userName, password: decodedToken.password };
//   } catch (error) {    
//     console.error("Error al verificar el token:", error.message);
//     return false;
//   }
// }

const getDocIdFromToken = async (projectCollection, token)=>{ 
  const usersRef = firestore.collection(projectCollection);  
  const query = usersRef.where('token', '==', token);    
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

  if( typeof projectCollection === 'string' && 
      projectCollection !== undefined && 
      projectCollection !== "" &&   
      typeof userName === 'string' && 
      userName !== undefined && 
      userName !== "" &&   
      typeof password === 'string' &&
      password !== undefined  && 
      password !== ""){
        const token = await encodeToken(userName, password)

        if(token){
          const isRegisteredUserResult = await isRegisteredUser(projectCollection, token)
        
          if(isRegisteredUserResult){           
            res.status(200).json({ message: "User logged", "token": token });     
          }
          else res.status(404).json({ message: "Wrong username or password"});
        }
        else res.status(500).json({ message: "Server had a problem. Try later please."})        
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

    const token = await encodeToken(userName, password)    

    if(token){
      const isRegisteredUserResult = await isRegisteredUser(projectCollection, token)    

      if(!isRegisteredUserResult){    
        await addNewUser(projectCollection, token)
        res.status(201).json({ message: "User successfully created" });
      } 
      else{
        res.status(409).json({ message: "Username is already taken" });
      }   
    }
    else res.status(500).json({ message: "Server had a problem. Try later please."})    
  }
  else{res.status(400).json({ message: "Bad request. The parameters must be string and they mustn't be empty values"})}
})   

app.post('/getContentLikedData', async(req, res) => {  
  const token                   = req.body.token;
  const projectCollection       = req.body.projectCollection 
  
  const docId = await getDocIdFromToken(projectCollection, token)  
  const contentLikedData = await getContentLikedData(projectCollection, docId) 

  console.log(contentLikedData)

  res.status(200).json({ "contentLiked": contentLikedData }); 
})

app.post('/setContentLikedData', async(req, res) => {  
  const token                   = req.body.token;
  const projectCollection       = req.body.projectCollection 
  const updatedData             = req.body.updatedData 

  const docId = await getDocIdFromToken(projectCollection, token)
  console.log("set previo", userName, password, docId)
  const contentLikedData = await setContentLikedData(projectCollection, docId, updatedData) 

  res.status(200).json({ "setcontentLiked": contentLikedData}); 
})


const options = {
  key: fs.readFileSync('/etc/cert/privkey.pem'),
  cert: fs.readFileSync('/etc/cert/fullchain.pem')
};

const server = https.createServer(options, app);
const port = 3100


server.listen(port, () => {
  console.log(`Servidor HTTPS escuchando en el puerto ${port}`);
});

