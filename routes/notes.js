const express=require('express');
const router=express.Router();
const fetchuser=require('../middleware/fetchuser')
const Notes=require('../models/Notes')
const {body,validationResult}=require('express-validator');

//Route1: Get all the notes using Get "/api/auth/fetchallnotes" .Login required 
router.get('/fetchallnotes',fetchuser,async (req,res)=>{
    const notes= await Notes.find({user:req.user.id});
    res.json(notes);
})

//Route2: add new notes using Post "/api/auth/addnotes" .Login required 
router.post('/addnotes',fetchuser,[
    body('title','Enter a valid title').isLength({min:3}),
    body('description','Must be atleast 5 characters').isLength({min:5})
],async (req,res)=>{
    try {
        const {title,description,tag}=req.body    
        const result=validationResult(req)
        if(!result.isEmpty()){
        return res.status(400).json({errors:result.array()})
        }
        
        const note=new Notes({
            title,description,tag,user:req.user.id
        })
        const savednotes= await note.save()
    
        res.json(savednotes)
    } catch (error) {
        console.log(error.message)
        res.status(500).send({msg:"Internal server error occured"})
    }
  
})

//Route3: update existing notes using Put "/api/auth/addnotes" .Login required 
router.put('/updatenote/:id',fetchuser,async (req,res)=>{
const {title,description,tag}=req.body
//create a newnote object
const newNote={}
if(title){newNote.title=title};
if(description){newNote.description=description};
if(tag){newNote.tag=tag};

//find the note to be updated
let note=await Notes.findById(req.params.id);
if(!note){return res.status(404).send("Not found")}
if(note.user.toString() !== req.user.id){
    return res.status(401).send("Not allowed");
}
note= await Notes.findByIdAndUpdate(req.params.id,{$set:newNote},{new:true})
res.json(note)
})

//Route4: delete existing notes using delete "/api/auth/deletenote" .Login required 
router.delete('/deletenote/:id',fetchuser,async (req,res)=>{
   
    //find the note to be deleted
    let note=await Notes.findById(req.params.id);
    if(!note){return res.status(404).send("Not found")}

    //Allow deletion only if users own this note
    if(note.user.toString() !== req.user.id){
        return res.status(401).send("Not allowed");
    }
    note= await Notes.findByIdAndDelete(req.params.id)
    res.json({msg:"Success it has been deleted",note:note})
    })
    
module.exports=router