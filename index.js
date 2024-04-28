import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import AWS from "aws-sdk";
import { Student } from "./Student.js";
import { StudentTime } from "./StudentTime.js";
import mongoose from "mongoose";
import { Camera } from "./Camera.js";
import { config } from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.A1,
    authDomain: process.env.A2,
    projectId: process.env.A3,
    storageBucket: process.env.A4,
    messagingSenderId: process.env.A5,
    appId: process.env.A6,
};
const fireApp = initializeApp(firebaseConfig);
const db = getFirestore(fireApp);

config();
// import service from "./q.json";
// import * as Admin from "firebase-admin";
// import {getDocs, setDoc} from "firebase/firestore"
console.log(process.env);
AWS.config.update({
    accessKeyId: process.env.KEY,
    secretAccessKey: process.env.ACCESS,
    region: "ap-northeast-1",
});
// const mongoString = "mongodb://127.0.0.1:27017"
// const mongoString = "mongodb+srv://minecraftdeleted45:1234@cluster0.jn12lsa.mongodb.net/?retryWrites=true&w=majority";
// mongoose.connect(mongoString);
// const database = mongoose.connection;
// database.on("error", (error) => {
//     console.log(error);
// });
// database.once("connected", async () => {
//     console.log("Connect");
// });

// Admin.initializeApp({
//     credential: Admin.credential.cert(service),
// });

// const db = Admin.firestore();
const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
var s3 = new AWS.S3();

app.get("/api/", (req, res) => {
    res.send("Hello World!");
});

app.post("/api/uploadStudent", async (req, res) => {
    console.log("ASdasd");
    const data = req.body;
    const image = data.image;
    console.log(image);
    if (!image) {
        return;
    }

    fs.writeFile("pic.jpg", image.split(",")[1], "base64", (err) => {});
    setTimeout(() => {
        fs.readFile("pic.jpg", async function (err, data) {
            if (err) {
                throw err;
            }
            // const students = db
            //     .getFirestore()
            //     .collection("students")
            //     .doc(data.length);
            let i = 0;
            const querySnapshot = await getDocs(collection(db, "student"));
            querySnapshot.forEach((doc) => {
                i++;
            });

            // const students = await Student.find();
            const params = {
                Bucket: "school-1",
                Key: "test/testingHaku" + i + ".jpg",
                Body: data,
            };
            s3.putObject(params, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully uploaded data to myBucket/myKey");
                }
            });
        });
    }, 100);
    // const student = new Student({
    //     name: data.name,
    //     phone: data.phone,
    //     address: data.address,
    //     oPhone: data.oPhone,
    //     _id: data.id,
    //     picture: data.image,
    // });
    // student.save();
    const docRef = await addDoc(collection(db, "student"), {
        name: data.name,
        phone: data.phone,
        address: data.address,
        oPhone: data.oPhone,
        _id: data.id,
        picture: data.image,
    });

    res.redirect("http://localhost:3000/customers");
});

app.get("/api/students", async (req, res) => {
    const students = [];
    const querySnapshot = await getDocs(collection(db, "student"));
    querySnapshot.forEach((doc) => {
        // console.log(`${doc.id} => ${doc.data()}`);
        students.push(doc.data());
    });

    res.json(students);
});

app.get("/api/getStudent", async (req, res) => {
    const id = req.query.id;
    const student = await Student.findById(id);
    const querySnapshot = await getDocs(collection(db, "student"));
    querySnapshot.forEach((doc) => {
        if (doc.data()._id == id) {
            res.json([doc.data()]);
            return;
        }
    });

    res.json([student]);
});
app.get("/api/getStudentTime", async (req, res) => {
    const date = req.query.date;
    const time = req.query.time;
    const classN = req.query.class;
    const querySnapshot = await getDocs(collection(db, "studentTime"));
    var student = [];
    querySnapshot.forEach((doc) => {
        if (
            doc.data().Date == date &&
            doc.data().Time == time &&
            doc.data().Class == classN
        ) {
            student.push(doc.data());
        }
    });

    // var student = await StudentTime.find({
    //     Date: date,
    //     Time: time,
    //     Class: classN,
    // });
    if (student.length == 0) {
        // var students = await Student.find();
        var students = [];
        const querySnapshot = await getDocs(collection(db, "student"));
        querySnapshot.forEach((doc) => {
            students.push(doc.data());
            console.log(`${doc.id} => ${doc.data()}`);
        });

        for (let i = 0; i < students.length; i++) {
            console.log(date, time, classN, students[i]._id);
            // const studentTime = new StudentTime({
            //     Date: date,
            //     Time: time,
            //     Class: classN,
            //     SID: students[i]._id,
            //     isCome: "false",
            // });
            const docRef = await addDoc(collection(db, "studentTime"), {
                Date: date,
                Time: time,
                Class: classN,
                SID: students[i]._id,
                isCome: "false",
            });

            // studentTime.save();
        }

        // student = await StudentTime.find({
        //     Date: date,
        //     Time: time,
        //     Class: classN,
        // });
        const querSnapshot = await getDocs(collection(db, "studentTime"));
        var student = [];
        querSnapshot.forEach((doc) => {
            if (
                doc.data().Date == date &&
                doc.data().Time == time &&
                doc.data().Class == classN
            ) {
                student.push(doc.data());
            }
        });
    }
    res.json(student);
});

app.post("/api/addCamera", async (req, res) => {
    const data = req.body;
    const docRef = await addDoc(collection(db, "camera"), {
        name: data.name,
        ip: data.ip,
    });
    // const camera = new Camera({
    //     name: data.name,
    //     ip: data.ip,
    // });

    // camera.save();
    res.redirect("http://localhost:3000/orders");
});

app.get("/api/getCameras", async (req, res) => {
    const querSnapshot = await getDocs(collection(db, "studentTime"));
    var cameras = [];
    querSnapshot.forEach((doc) => {
        cameras.push(doc.data());
    });
    res.json(cameras);
});

app.get("/api/getCamera", async (req, res) => {
    const id = req.query.id;
    const querSnapshot = await getDocs(collection(db, "studentTime"));
    var cameras = [];
    querSnapshot.forEach((doc) => {
        if (doc.data()._id == id) {
            res.json([doc.data()]);
            return;
        }
        cameras.push(doc.data());
    });
    // res.json(cameras);
    // const camera = await Camera.findById(id);
    // res.json([camera]);
});
const names = [
    { name: "Erkhem-Erdene", id: "2024A001" },
    { name: "Munkhjin", id: "2024A002" },
    { name: "Dulguun", id: "2024A003" },
];
app.post("/base64", async (req, res) => {
    const data = req.body;
    const image = data.data;
    const person = JSON.parse(image);
    const matchedNames = person.FaceSearchResponse.map(
        (response) => response.MatchedFaces[0].Faces.ExternalIndex
    );
    const filteredNames = names.filter((person) =>
        matchedNames.includes(person.name)
    );

    console.log(filteredNames);
    res.send(filteredNames);
});

const PORT = 5000;

app.listen(PORT, "0.0.0.0");
