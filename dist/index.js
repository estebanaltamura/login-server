"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firestore_1 = require("@google-cloud/firestore");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
const firestore = new firestore_1.Firestore({
    projectId: 'login-7e24a',
    keyFilename: '/home/ubuntu/projects/login-server/src/login-7e24a-firebase-adminsdk-tbg0z-3d702abca0.json',
});
const encodeToken = (userName, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const privateKey = yield fs_1.default.promises.readFile('/home/ssm-user/projects/login-server/privateKey.txt', 'utf8');
        const token = jsonwebtoken_1.default.sign({ userName, password }, privateKey, { noTimestamp: true });
        return token;
    }
    catch (error) {
        console.error('Error tokenizando userName y password', error);
        return null;
    }
});
const isRegisteredUser = (projectCollection, token) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(token);
    const usersRef = firestore.collection(projectCollection);
    const query = usersRef.where('token', '==', token);
    try {
        const querySnapshot = yield query.get();
        return !querySnapshot.empty;
    }
    catch (error) {
        console.error('Error comprobando si el usuario esta registrado', error);
        return null;
    }
});
const addNewUser = (projectCollection, token) => __awaiter(void 0, void 0, void 0, function* () {
    const userCollection = firestore.collection(projectCollection);
    const newUser = {
        token,
        contentLiked: { movies: [], tvSeries: [], allFavorites: [] },
    };
    try {
        yield userCollection.add(newUser);
    }
    catch (error) {
        console.error('Error creando usuario', error);
        return null;
    }
});
const getDocIdFromToken = (projectCollection, token) => __awaiter(void 0, void 0, void 0, function* () {
    const usersRef = firestore.collection(projectCollection);
    const query = usersRef.where('token', '==', token);
    try {
        const querySnapshot = yield query.get();
        if (querySnapshot.empty) {
            return false;
        }
        else {
            return querySnapshot.docs[0].id;
        }
    }
    catch (error) {
        console.error('Error buscando id del documento', error);
        return null;
    }
});
const getContentLikedData = (projectCollection, docId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const docRef = firestore.collection(projectCollection).doc(docId);
        const docSnapshot = yield docRef.get();
        const docSnapshotData = docSnapshot.data();
        if (docSnapshotData) {
            const contentLikedValue = docSnapshotData.contentLiked;
            return contentLikedValue;
        }
        else
            return false;
    }
    catch (error) {
        console.error('Error al solicitar documento', error);
        return null;
    }
});
const setContentLikedData = (projectCollection, docId, updatedData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const docRef = firestore.collection(projectCollection).doc(docId);
        yield docRef.update(updatedData);
    }
    catch (error) {
        console.error('Error al actualizar el documento:', error);
        return null;
    }
});
const areValidValues = (projectCollection, userName, password) => {
    if (typeof projectCollection === 'string' &&
        projectCollection !== undefined &&
        projectCollection !== '' &&
        typeof userName === 'string' &&
        userName !== undefined &&
        userName !== '' &&
        typeof password === 'string' &&
        password !== undefined &&
        password !== '') {
        return true;
    }
    return false;
};
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectCollection, userName, password } = req.body;
    if (areValidValues(projectCollection, userName, password)) {
        const token = yield encodeToken(userName, password);
        if (token) {
            const isRegisteredUserResult = yield isRegisteredUser(projectCollection, token);
            if (isRegisteredUserResult) {
                res.status(200).json({ message: 'User logged', token: token });
            }
            else if (isRegisteredUserResult === false)
                res.status(404).json({ message: 'Wrong username or password' });
            else
                res
                    .status(500)
                    .json({ message: 'Server had a problem. Try later please.' });
        }
        else
            res
                .status(500)
                .json({ message: 'Server had a problem. Try later please.' });
    }
    else {
        res.status(400).json({
            message: "Bad request. The parameters must be string and they mustn't be empty values",
        });
    }
}));
app.post('/registerUser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('entro');
    const { projectCollection, userName, password } = req.body;
    if (areValidValues(projectCollection, userName, password)) {
        const token = yield encodeToken(userName, password);
        if (token) {
            const isRegisteredUserResult = yield isRegisteredUser(projectCollection, token);
            if (isRegisteredUserResult === false) {
                yield addNewUser(projectCollection, token);
                res.status(201).json({ message: 'User successfully created' });
            }
            else if (isRegisteredUserResult === true)
                res.status(409).json({ message: 'Username is already taken' });
            else
                res
                    .status(500)
                    .json({ message: 'Server had a problem. Try later please.' });
        }
        else
            res
                .status(500)
                .json({ message: 'Server had a problem. Try later please.' });
    }
    else {
        res.status(400).json({
            message: "Bad request. The parameters must be string and they mustn't be empty values",
        });
    }
}));
app.post('/googleLogin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectCollection, tokenFromGoogle } = req.body;
    console.log(projectCollection, tokenFromGoogle);
    if (tokenFromGoogle) {
        const isRegisteredUserResult = yield isRegisteredUser(projectCollection, tokenFromGoogle);
        if (isRegisteredUserResult === false) {
            yield addNewUser(projectCollection, tokenFromGoogle);
            res.status(201).json({
                message: 'User successfully created',
                token: tokenFromGoogle,
            });
        }
        else if (isRegisteredUserResult === true)
            res
                .status(200)
                .json({ message: 'User logged', token: tokenFromGoogle });
        else
            res
                .status(500)
                .json({ message: 'Server had a problem. Try later please.' });
    }
    else
        res
            .status(500)
            .json({ message: 'Server had a problem. Try later please.' });
}));
app.post('/getContentLikedData', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, projectCollection } = req.body;
    const docId = yield getDocIdFromToken(projectCollection, token);
    if (docId) {
        const contentLikedData = yield getContentLikedData(projectCollection, docId);
        res.status(200).json({ contentLiked: contentLikedData });
    }
    else
        res
            .status(500)
            .json({ message: 'Server had a problem. Try later please.' });
}));
app.post('/setContentLikedData', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, projectCollection, updatedData } = req.body;
    const docId = yield getDocIdFromToken(projectCollection, token);
    if (docId) {
        const contentLikedData = yield setContentLikedData(projectCollection, docId, updatedData);
        res.status(200).json({ setcontentLiked: contentLikedData });
    }
    else
        res
            .status(500)
            .json({ message: 'Server had a problem. Try later please.' });
}));
const options = {
    key: fs_1.default.readFileSync('/etc/cert/privkey.pem'),
    cert: fs_1.default.readFileSync('/etc/cert/fullchain.pem'),
};
const server = https_1.default.createServer(options, app);
const port = 3100;
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
