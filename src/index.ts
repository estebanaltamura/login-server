import fs from 'fs'
import https from 'https'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import jsonWebToken from 'jsonwebtoken'
import { Firestore, DocumentSnapshot } from '@google-cloud/firestore'
import { Response } from 'express';
import { RequestRegisterLoginInterface, 
  RequestGoogleLoginInterface,
  RequestGetContentInterface, 
  RequestSetContentInterface,
  ContentLikedInterface,
  UpdatedData } from './types'


const app = express();
app.use(cors());
app.use(bodyParser.json());

const firestore = new Firestore({
  projectId: 'login-7e24a',
  keyFilename: '/home/ubuntu/projects/login-server/login-7e24a-firebase-adminsdk-tbg0z-3d702abca0.json',
});

const encodeToken = async (userName: string, password: string): Promise<string | null>=>{
  try{
    const privateKey: string = await fs.promises.readFile('/home/ubuntu/projects/login-server/privateKey.txt', 'utf8')    
    const token:string = jsonWebToken.sign({ userName, password }, privateKey, { noTimestamp: true });  
    return token
  }
  catch(error){
    console.error('Error tokenizando userName y password', error)
    return null
  }  
}

const isRegisteredUser = async(projectCollection: string, token: string): Promise<boolean | null> => {
  const usersRef = firestore.collection(projectCollection);  
  const query = usersRef.where('token', '==', token);
  try{
    const querySnapshot = await query.get();
    return !querySnapshot.empty;
  }
  catch(error){
    console.error('Error comprobando si el usuario esta registrado', error)
    return null
  }  
}

const addNewUser = async (projectCollection: string, token: string):Promise<void | null> => {
  const userCollection = firestore.collection(projectCollection);  

  const newUser = {
    token,    
    contentLiked: {'movies': [], 'tvSeries': [], 'allFavorites': []}
  }

  try{
    await userCollection.add(newUser);
  }
  catch(error){
    console.error('Error creando usuario', error)
    return null
  }    
}

const getDocIdFromToken = async (projectCollection: string, token: string): Promise<false | string | null>=>{ 
  const usersRef = firestore.collection(projectCollection);  
  const query = usersRef.where('token', '==', token); 
  
  try{
    const querySnapshot = await query.get();
  
    if (querySnapshot.empty) {
      return false; 
    } else {      
      return querySnapshot.docs[0].id;
    } 
  }
  catch(error){
    console.error('Error buscando id del documento', error)
    return null
  }   
}

const getContentLikedData = async (projectCollection: string, docId: string): Promise<Object | null | false>=>{
  
  try{
    const docRef = firestore.collection(projectCollection).doc(docId);     
    const docSnapshot: DocumentSnapshot = await docRef.get();    
    const docSnapshotData: ContentLikedInterface | undefined = docSnapshot.data()
    
    if(docSnapshotData){      
        const contentLikedValue: Object = docSnapshotData.contentLiked as Object
        return contentLikedValue       
    }
    else return false      
  }
  catch(error){
    console.error('Error al solicitar documento', error)
    return null
  }  
}

const setContentLikedData = async (projectCollection: string, docId: string, updatedData: UpdatedData): Promise<void | null>=>{  
  try{
    const docRef = firestore.collection(projectCollection).doc(docId);     
    await docRef.update(updatedData);    
  } 
  catch (error) {
    console.error('Error al actualizar el documento:', error);
    return null
  }
}

const areValidValues = (projectCollection: string, userName:string, password:string): boolean=>{
  if( typeof projectCollection === 'string' && 
  projectCollection !== undefined && 
  projectCollection !== "" &&   
  typeof userName === 'string' && 
  userName !== undefined && 
  userName !== "" &&   
  typeof password === 'string' &&
  password !== undefined  && 
  password !== ""){
    return true
  }
  return false
}

app.post('/login', async(req: RequestRegisterLoginInterface, res: Response) => {   
  const { projectCollection, userName, password } = req.body

  if(areValidValues(projectCollection, userName, password)){
        const token = await encodeToken(userName, password)

        if(token){
          const isRegisteredUserResult = await isRegisteredUser(projectCollection, token)
        
          if(isRegisteredUserResult){           
            res.status(200).json({ message: "User logged", "token": token });     
          }
          else if(isRegisteredUserResult === false) res.status(404).json({ message: "Wrong username or password"});
          else res.status(500).json({ message: "Server had a problem. Try later please."})
        }
        else res.status(500).json({ message: "Server had a problem. Try later please."})        
      }
  else{res.status(400).json({ message: "Bad request. The parameters must be string and they mustn't be empty values"})}  
});


app.post('/registerUser', async(req: RequestRegisterLoginInterface, res: Response) => {
  const { projectCollection, userName, password} = req.body 

  if(areValidValues(projectCollection, userName, password)){
    const token = await encodeToken(userName, password)    

    if(token){
      const isRegisteredUserResult = await isRegisteredUser(projectCollection, token)    

      if(isRegisteredUserResult === false){    
        await addNewUser(projectCollection, token)
        res.status(201).json({ message: "User successfully created" });
      } 
      else if(isRegisteredUserResult === true) res.status(409).json({ message: "Username is already taken" });
      else res.status(500).json({ message: "Server had a problem. Try later please."})
         
    }
    else res.status(500).json({ message: "Server had a problem. Try later please."})    
  }
  else{res.status(400).json({ message: "Bad request. The parameters must be string and they mustn't be empty values"})}
})   

app.post('/googleLogin', async(req: RequestGoogleLoginInterface, res: Response) => {
  const { projectCollection, tokenFromGoogle } = req.body 

  console.log(projectCollection, tokenFromGoogle)
  if(tokenFromGoogle){
    const isRegisteredUserResult = await isRegisteredUser(projectCollection, tokenFromGoogle)    

    if(isRegisteredUserResult === false){    
      await addNewUser(projectCollection, tokenFromGoogle)
      res.status(201).json({ message: "User successfully created", "token": tokenFromGoogle });
    } 
    else if(isRegisteredUserResult === true) res.status(200).json({ message: "User logged", "token": tokenFromGoogle }); 
    else res.status(500).json({ message: "Server had a problem. Try later please."})         
  }
  else res.status(500).json({ message: "Server had a problem. Try later please."})      
}) 

app.post('/getContentLikedData', async(req: RequestGetContentInterface, res: Response) => {  
  const { token, projectCollection } = req.body  
  
  const docId = await getDocIdFromToken(projectCollection, token)  
  
  if(docId){
    const contentLikedData = await getContentLikedData(projectCollection, docId)    
    res.status(200).json({ "contentLiked": contentLikedData });
  }
  else res.status(500).json({ message: "Server had a problem. Try later please."})    
})

app.post('/setContentLikedData', async(req: RequestSetContentInterface, res: Response) => {  
  const { token, projectCollection, updatedData } = req.body  

  const docId = await getDocIdFromToken(projectCollection, token)
  
  if(docId){
    const contentLikedData = await setContentLikedData(projectCollection, docId, updatedData) 
    res.status(200).json({ "setcontentLiked": contentLikedData});
  }
  else res.status(500).json({ message: "Server had a problem. Try later please."})   
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


/*

3 microservicios
-login(collection, email, contraseña, extras) Si: retorna token No: Advertencia al usuario
-register(collection, email, contraseña, extras) isRegistered? Si: Advertencia al usuario No: registrar y crear usuario
-googleSigninHandler servicio(collection, idUnico, email, extras). isRegistered? Si: traer token No: registrar y crear usuario





  Si no existe un registro del idunico:
  1-Registro con nombre de usuario y contraseña (Con los datos del form): 
    -En el front servicio(collection, email, contraseña, extras)    
    -email y contraseña se convierten en un token que es lo que una de las propiedades que se registra
    -Ademas del token se podria registrar el mail y los extras que pueden ser tratadas por params para tener cantidad de parametros no definidos
    -Ademas pueden agregarse propiedades particulares no tratadas en el front

  2-Registro por google. (idUnico retornado en objeto user):
    -En el front el usuario entra por la opcion google y elije con que cuenta loguearse
    -En el front: Cuando google retorna el objeto user se usa para (collection, email, contraseña, extras)    
    -email y contraseña se convierten en un token que es lo que una de las propiedades que se registra
    -Ademas del token se podria registrar el mail y los extras que pueden ser tratadas por params para tener cantidad de parametros no definidos
    -Ademas pueden agregarse propiedades particulares no tratadas en el front  

  Si existe un registro del idunico:
  3-Login:
    -En el front: servicio(collection, email, contraseña
    -Si lo back: si lo encuentra retorna los datos
    
  4-Update and delete para cada proyecto en particular

  Para qr-menu
    -Si el usuario se loguea con el servicio por email y contraseña mio, el retorno del servicio se aasigna a un estado
    -Si elige por google, algun identicador unico que retorne y usemos para registrar

*/ 








