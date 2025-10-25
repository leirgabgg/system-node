const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const db = require('./database');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Configurações
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Middleware de autenticação
function authMiddleware(req, res, next) {
    if (!req.session.user) return res.redirect('/');
    next();
}

// Rotas

// Página inicial
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

// Cadastro
app.post('/register', async (req, res) => {
    const { name, email, password, birthdate, role, course } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
        `INSERT INTO users (name, email, password, birthdate, role, course) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, hashedPassword, birthdate, role, course || null],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            req.session.user = { id: this.lastID, name, email, role, course };
            res.json({ success: true });
        }
    );
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Usuário não encontrado' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Senha incorreta' });

        req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role, course: user.course };
        res.json({ success: true });
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Dashboard principal
app.get('/dashboard', authMiddleware, (req, res) => {
    const user = req.session.user;
    if(user.role === 'aluno'){
        // Buscar notas e provas disponíveis
        db.all(`SELECT e.id as exam_id, e.subject, e.questions, r.score 
                FROM exams e
                LEFT JOIN exam_results r ON e.id=r.exam_id AND r.student_id=?`,
                [user.id], (err, exams) => {
            res.render('dashboard', { user, exams });
        });
    } else if(user.role === 'professor'){
        // Buscar alunos do curso do professor e provas criadas
        db.all(`SELECT * FROM users WHERE role='aluno' AND course=?`, [user.course], (err, students) => {
            db.all(`SELECT * FROM exams WHERE course=?`, [user.course], (err2, exams) => {
                res.render('dashboard', { user, students, exams });
            });
        });
    } else if(user.role === 'admin'){
        // Administração vê tudo
        db.all(`SELECT * FROM users`, (err, users) => {
            db.all(`SELECT * FROM exams`, (err2, exams) => {
                res.render('dashboard', { user, users, exams });
            });
        });
    }
});

// Criar prova (só professor/admin)
app.post('/create-exam', authMiddleware, async (req, res) => {
    const { subject } = req.body;
    const course = req.session.user.course;

    // Chamando API Groq ou similar para gerar 20 questões
    // Aqui vamos simular com perguntas dummy
    const questions = Array.from({length:20}, (_,i)=>`Questão ${i+1} sobre ${subject}`).join('|');

    db.run(`INSERT INTO exams (course, subject, questions) VALUES (?,?,?)`, [course, subject, questions], (err)=>{
        if(err) return res.status(400).json({error:err.message});
        res.json({success:true});
    });
});

// Fazer prova (aluno)
app.post('/take-exam', authMiddleware, (req,res)=>{
    const { exam_id, answers } = req.body;
    const student_id = req.session.user.id;

    // Buscar prova
    db.get(`SELECT * FROM exams WHERE id=?`, [exam_id], (err, exam)=>{
        if(err || !exam) return res.status(400).json({error:'Prova não encontrada'});

        // Corrigir automaticamente (simulação: cada resposta correta = 1 ponto)
        const questions = exam.questions.split('|');
        const studentAnswers = answers.split('|');
        let score = 0;
        for(let i=0;i<questions.length;i++){
            if(studentAnswers[i] && studentAnswers[i].toLowerCase() === 'resposta correta') score++;
        }

        db.run(`INSERT INTO exam_results (exam_id, student_id, answers, score) VALUES (?,?,?,?)`,
            [exam_id, student_id, answers, score], (err2)=>{
                if(err2) return res.status(400).json({error:err2.message});
                res.json({success:true, score});
            });
    });
});

// Ver resultados de alunos (professor)
app.get('/exam-results/:exam_id', authMiddleware, (req,res)=>{
    if(req.session.user.role!=='professor' && req.session.user.role!=='admin') return res.status(403).send('Acesso negado');
    const exam_id = req.params.exam_id;
    db.all(`SELECT r.*, u.name FROM exam_results r JOIN users u ON r.student_id=u.id WHERE r.exam_id=?`, [exam_id], (err, results)=>{
        res.json(results);
    });
});

// Feedback
app.post('/feedback', (req, res) => {
    const { comment, like, dislike } = req.body;
    db.run(`INSERT INTO feedback (comment, like_count, dislike_count) VALUES (?, ?, ?)`,
        [comment, like || 0, dislike || 0],
        (err) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.get('/comments', (req, res) => {
    db.all(`SELECT * FROM feedback ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(400).send(err.message);
        res.render('comments', { feedbacks: rows });
    });
});

// Start server
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
