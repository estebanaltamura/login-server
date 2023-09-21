import { Request } from 'express';

interface RequestLoginInterface extends Request {
  body:
    {
      projectCollection: string, 
      userName: string, 
      password: string 
    }
}

interface RequestRegisterInterface extends Request {
  body:
    {
      projectCollection: string, 
      userName: string, 
      password: string 
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
  RequestLoginInterface,
  RequestRegisterInterface,
  RequestGetContentInterface,
  RequestSetContentInterface,
  ContentLikedInterface,
  UpdatedData
}