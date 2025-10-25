document.addEventListener('DOMContentLoaded', () => {

    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackBody = document.getElementById('feedback-body');
    const feedbackBtn = document.getElementById('feedback-btn');

    function addCloseButton(modalContent){
        if(!modalContent) return;
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.classList.add('modal-close');
        closeBtn.onclick = () => { if(modalContent.parentElement) modalContent.parentElement.style.display = 'none'; };
        // prepend only if supported
        if(typeof modalContent.prepend === 'function') modalContent.prepend(closeBtn);
        else modalContent.insertBefore(closeBtn, modalContent.firstChild);
    }

    function showModal(content){
        modalBody.innerHTML = content;
        addCloseButton(modalBody);
        modal.style.display = 'flex';
    }

    function hideModal(){ modal.style.display = 'none'; }

    feedbackBtn?.addEventListener('click', () => {
        feedbackBody.innerHTML = `
            <h3>Deixe sua avaliação</h3>
            <textarea id="feedback-comment" placeholder="Escreva um comentário..."></textarea>
            <button onclick="sendFeedback(1)">👍 Like</button>
            <button onclick="sendFeedback(0)">👎 Dislike</button>
        `;
        addCloseButton(feedbackBody);
        feedbackModal.style.display = 'flex';
    });

    if(modal){
        modal.addEventListener('click', (e) => { if(e.target === modal) hideModal(); });
    }
    if(feedbackModal){
        feedbackModal.addEventListener('click', (e) => { if(e.target === feedbackModal) feedbackModal.style.display='none'; });
    }

    function toggleCourse(role){
        const el = document.getElementById('reg-course');
        if(!el) return;
        el.style.display = (role==='aluno' || role==='professor') ? 'block':'none';
    }

    async function register(){
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const birthdate = document.getElementById('reg-birthdate').value;
        const role = document.getElementById('reg-role').value;
        const course = document.getElementById('reg-course')?.value;

        const res = await fetch('/register',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({name,email,password,birthdate,role,course})
        });
        const data = await res.json();
        if(data.success) location.reload();
        else alert(data.error);
    }

    async function login(){
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const res = await fetch('/login',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({email,password})
        });
        const data = await res.json();
        if(data.success) location.reload();
        else alert(data.error);
    }

    async function sendFeedback(like){
        const comment = document.getElementById('feedback-comment').value;
        if(!comment) return alert('Escreva um comentário');
        const res = await fetch('/feedback',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({comment, like, dislike: like ? 0 : 1})
        });
        const data = await res.json();
        if(data.success){
            feedbackModal.style.display = 'none';
            alert('Feedback enviado!');
            document.getElementById('feedback-comment').value='';
        } else alert('Erro ao enviar');
    }

    // Botões de login e cadastro
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        showModal(`
            <h3>Login</h3>
            <input id="login-email" placeholder="Email"><br><br>
            <input type="password" id="login-password" placeholder="Senha"><br><br>
            <button onclick="login()">Entrar</button>
        `);
    });

    document.getElementById('registerBtn')?.addEventListener('click', () => {
        showModal(`
            <h3>Cadastro</h3>
            <input id="reg-name" placeholder="Nome"><br><br>
            <input id="reg-email" placeholder="Email"><br><br>
            <input type="password" id="reg-password" placeholder="Senha"><br><br>
            <input type="date" id="reg-birthdate"><br><br>
            <select id="reg-role" onchange="toggleCourse(this.value)">
                <option value="">Escolha a ocupação</option>
                <option value="aluno">Aluno</option>
                <option value="professor">Professor</option>
                <option value="admin">Administração</option>
            </select><br><br>
            <select id="reg-course" style="display:none;">
                <option value="">Escolha o curso</option>
                <option value="Desenvolvimento de Sistemas">Desenvolvimento de Sistemas</option>
                <option value="Enfermagem">Enfermagem</option>
                <option value="Estética">Estética</option>
                <option value="Radiologia">Radiologia</option>
                <option value="Marketing">Marketing</option>
                <option value="Administração">Administração</option>
                <option value="Segurança do Trabalho">Segurança do Trabalho</option>
            </select><br><br>
            <button onclick="register()">Cadastrar</button>
        `);
    });

    // Tornar funções globais para onclick
    window.login = login;
    window.register = register;
    window.sendFeedback = sendFeedback;
    window.toggleCourse = toggleCourse;

});