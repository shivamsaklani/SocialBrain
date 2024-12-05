import express, { Request, response, Response } from "express";
import jwt from "jsonwebtoken";
import { UserModel, ContentModel, LinkModel } from "./Database";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { UserSchema, SigninSchema } from "./Zod";
import { v4 as uuidv4 } from "uuid";
import { authorization } from "./Middleware";
import cors from "cors";

// Load environment variables
dotenv.config();
const secret = process.env.JWTSECRET as string;
const port = Number(process.env.PORT || 3000);
const baseurl=process.env.baseurl

const app = express();
app.use(express.json());
app.use(cors());

interface SignupRequestBody {
  user: string;
  password: string;
  email: string;
}

interface SigninRequestBody {
  email: string;
  password: string;
}

interface ContentRequestBody {
  user: { _id: string };
  type: string;
  link: string;
  title: string;
  tags: string[];
  description: string;
}


app.get("/",async (req:Request,res:Response)=>{
  res.send("Server Working Fine");
   
})
// Signup Route
app.post("/Signup", async (req: Request<{}, {}, SignupRequestBody>, res: Response) => {
  const { user, password, email } = req.body;
  let mesg = "";
  let status: number;

  const hashedpassword = await bcrypt.hash(password, 10);

  // Validate input using Zod schema
  const validUser = UserSchema.safeParse(req.body);
  if (!validUser.success) {
    mesg = "Validation error (Zod)";
    status = 400; // Bad Request
  } else {
    try {
      // Create user in the database
      await UserModel.create({ email, user, password: hashedpassword });
      mesg = "Signup successful";
      status = 201; // Created
    } catch (error) {
      // Handle database or server errors
      mesg = `Error: ${error}`;
      status = 500; // Internal Server Error
    }
  }

  // Set status and send JSON response
  res.status(status).json({ mesg });
});

// Signin Route
app.post("/Signin", async (req: Request<{}, {}, SigninRequestBody>, res: Response) => {
  const { email, password } = req.body;
  let mesg = "";
  let token = "";
  let status: number;

  // Validate input using Zod schema
  const validUser = SigninSchema.safeParse(req.body);
  if (!validUser.success) {
    mesg = "Zod validation error";
    status = 400; // Bad Request
  } else {
    try {
      const user = await UserModel.findOne({ email });
      if (user && (await bcrypt.compare(password, user.password))) {
        token = jwt.sign({ _id: user._id }, secret);
        mesg = "Success";
        status = 200; // OK
      } else {
        mesg = "Unauthorized access: Invalid email or password";
        status = 401; // Unauthorized
      }
    } catch (error) {
      mesg = `Server error: ${error}`;
      status = 500; // Internal Server Error
    }
  }

  res.status(status).json({ mesg, token });
});

// Create Content Route
app.post("/content/put", authorization, async (req: Request<{}, {}, ContentRequestBody>, res: Response) => {
  const { _id } = req.body.user;
  const { type, link, title, tags, description } = req.body;
  let mesg = "";
  let status = 201;

  try {
    await ContentModel.create({ title, tags, type, link, description, userId: _id });
  } catch (e) {
    mesg = `Error occurred: ${e}`;
    status = 500;
  }

  res.status(status).json({ mesg, contentId: _id });
});

// Get Content Route
app.get("/content/get", authorization, async (req: Request, res: Response) => {
  const { _id } = req.body.user;

  const content = await ContentModel.find({ userId: _id }).populate("userId", "user");

  res.json({ data: content });
});

// Delete Content Route
app.delete("/content/delete", authorization, async (req: Request, res: Response) => {
  const { _id } = req.body.user;
  const contentId = req.body.contentId;
  let mesg = "";
  let status = 200;

  try {
    const del = await ContentModel.deleteMany({ _id: contentId, userId: _id });
    if (del.deletedCount === 1) {
      mesg = "Deleted";
      status = 201;
    }
  } catch (e) {
    mesg = `Error: ${e}`;
    status = 500;
  }

  res.status(status).json({ mesg });
});

// Share Content Route
app.post("/content/share", authorization, async (req: Request, res: Response) => {
  const { _id } = req.body.user;
  const { share } = req.body;
  let mesg = "";
  let returnlink = "";
  const hashlink = uuidv4();

  const link = await LinkModel.findOne({ userId: _id });

  if (!share) {
    const removelink = await link?.deleteOne();
    if (removelink?.deletedCount === 1) {
      mesg = "Brain is Private";
    }
    returnlink = "null";
  } else {
    if (!link) {
      await LinkModel.create({ userId: _id, hash: hashlink });
      returnlink = `/content/share/${hashlink}`;
      mesg="link created";
    } else {
      returnlink = `/content/share/${link.hash}`;
      mesg="link exist";
    }
  }

  res.json({ mesg, link: returnlink });
});

app.get("/user/details/:id",async (req:Request,res:Response)=>{
  const {id} =req.params;
  let status:number;

   try {
    const Linkresposnse =await LinkModel.findOne({hash:id});
  
     const response= await UserModel.findOne({_id:Linkresposnse?.userId},{password:0});
     status = 200
     res.json({
       response,
       status: status
     })
   } catch (e) {
    status=504
    res.json({
      error:e,
      status:status
    })
    
   }
 
})

// Get Shared Content Route
app.get("/content/share/:sharelink", async (req: Request, res: Response) => {
  const { sharelink } = req.params;

  const linkDetails = await LinkModel.findOne({ hash: sharelink });
  const contentDetails = await ContentModel.find({ userId: linkDetails?.userId });

  res.json({ content: contentDetails });
});

// Start the server
app.listen(port);
