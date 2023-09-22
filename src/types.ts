import { Request } from 'express';

interface RequestRegisterLoginInterface extends Request {
  body:
    {
      projectCollection: string, 
      userName: string, 
      password: string 
    }
}

interface RequestGoogleLoginInterface extends Request {
  body:
    {
      projectCollection: string, 
      token: string      
    }
}


interface RequestGetContentInterface extends Request {
  body:
    {
      projectCollection: string, 
      token: string      
    }
}

interface RequestSetContentInterface extends Request {
  body:
    {
      projectCollection: string, 
      token: string,
      updatedData: UpdatedData      
    }
}

interface ContentLikedInterface extends FirebaseFirestore.DocumentData {
  contentLiked?: Object
}

interface UpdatedData{
  [Key: string]: unknown
}


export {
  RequestRegisterLoginInterface,
  RequestGoogleLoginInterface,
  RequestGetContentInterface,
  RequestSetContentInterface,
  ContentLikedInterface,
  UpdatedData
}