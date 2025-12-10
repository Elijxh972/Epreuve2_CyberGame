document.addEventListener('DOMContentLoaded', () => {

    // =======================
    // Gestion du token CSRF
    // =======================
    let csrfToken = '';
    
    // Récupérer le token CSRF au chargement
    async function getCSRFToken() {
        try {
            const response = await fetch('api/get-flag.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'get_token' })
            });
            const data = await response.json();
            if (data.csrf_token) {
                csrfToken = data.csrf_token;
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du token CSRF:', error);
        }
    }
    
    // Initialiser le token CSRF
    getCSRFToken();

    // =======================
    // Génération de particules
    // =======================
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }

    // =======================
    // Variables principales
    // =======================
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    const strengthPercent = document.getElementById('strengthPercent');
    const messageDiv = document.getElementById('message');

    // Sons (gestion d'erreur si fichiers absents)
    const successSound = new Audio('sounds/success.mp3');
    const errorSound = new Audio('sounds/error.mp3');
    successSound.onerror = () => {}; // Ignore les erreurs si fichiers absents
    errorSound.onerror = () => {};   // Ignore les erreurs si fichiers absents

    // =======================
    // Fonctions utilitaires
    // =======================
    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type} show`;
    }

    function stopForm() {
        submitBtn.disabled = true;
        passwordInput.disabled = true;
        confirmInput.disabled = true;
    }

    function resetFormState() {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        passwordInput.disabled = false;
        confirmInput.disabled = false;
        document.getElementById('btnText').style.display = 'inline';
    }

    function resetUI() {
        passwordInput.value = '';
        confirmInput.value = '';
        messageDiv.className = 'message';
        messageDiv.textContent = '';
        strengthFill.className = 'strength-fill';
        strengthPercent.textContent = '0%';
        strengthText.textContent = 'Force : Non conforme';
        Object.values(rules).forEach(rule => {
            const el = document.getElementById(rule.id);
            if (el) el.classList.remove('valid');
        });
    }

    function resetGame(reason) {
        resetFormState();
        resetUI();
        if (reason) showMessage(reason, 'error');
    }

    // =======================
    // Animation de succès cyberpunk
    // =======================
    function showSuccessAnimation(flag, message) {
        const overlay = document.getElementById('successOverlay');
        const successContainer = overlay.querySelector('.success-container');
        const successContent = overlay.querySelector('.success-content');
        const flagValue = document.getElementById('flagValue');
        const successTitle = overlay.querySelector('.success-title');
        const successSubtitle = overlay.querySelector('.success-subtitle');
        const successIcon = overlay.querySelector('.success-icon');
        const flagContainer = overlay.querySelector('.flag-container');
        
        // Réinitialiser l'overlay complètement pour éviter les bugs
        overlay.classList.remove('show', 'error-mode');
        
        // Masquer tout le contenu sauf les particules
        successContent.style.opacity = '0';
        successContent.style.display = 'none';
        
        // Réinitialiser le titre et le sous-titre
        successTitle.textContent = 'ACCÈS RÉCUPÉRÉ';
        successTitle.setAttribute('data-text', 'ACCÈS RÉCUPÉRÉ');
        successTitle.style.color = '#00ff9d';
        successTitle.style.textShadow = '0 0 10px #00ff9d, 0 0 20px #00ff9d';
        
        successSubtitle.textContent = 'Réinitialisation réussie';
        successSubtitle.style.color = '#09c7df';
        
        // Réinitialiser l'icône en coche verte
        successIcon.textContent = '✓';
        successIcon.style.color = '#00ff9d';
        successIcon.style.textShadow = '0 0 20px #00ff9d, 0 0 40px #00ff9d, 0 0 60px #00ff9d';
        successIcon.style.animation = '';
        
        // Réafficher le conteneur du flag
        flagContainer.style.display = 'block';
        flagValue.textContent = '';
        
        // Créer des particules animées (plus nombreuses pour l'effet)
        const particlesContainer = overlay.querySelector('.particles-success');
        particlesContainer.innerHTML = ''; // Nettoyer avant d'ajouter de nouvelles particules
        for (let i = 0; i < 80; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle-success';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 5 + 's';
            particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
            particlesContainer.appendChild(particle);
        }
        
        // Afficher l'overlay avec seulement les particules visibles
        overlay.classList.add('show');
        successContainer.style.border = 'none';
        successContainer.style.boxShadow = 'none';
        successContainer.style.background = 'transparent';
        
        // Après 5 secondes, afficher le reste du contenu
        setTimeout(() => {
            // Restaurer le style du conteneur
            successContainer.style.border = '';
            successContainer.style.boxShadow = '';
            successContainer.style.background = '';
            
            // Afficher le contenu avec animation
            successContent.style.display = 'block';
            successContent.style.opacity = '0';
            successContent.style.animation = 'slideUpFade 0.8s ease-out forwards';
            
            // Afficher l'icône avec animation
            successIcon.style.opacity = '0';
            successIcon.style.animation = 'iconPop 0.6s ease-out 0.2s forwards, iconGlow 2s ease-in-out infinite 0.8s';
            
            // Afficher le titre avec animation
            successTitle.style.opacity = '0';
            successTitle.style.animation = 'titleReveal 1s ease-out 0.5s forwards';
            
            // Afficher le sous-titre avec animation
            successSubtitle.style.opacity = '0';
            successSubtitle.style.animation = 'fadeIn 0.6s ease-out 1.2s forwards';
            
            // Afficher le conteneur du flag avec animation
            flagContainer.style.opacity = '0';
            flagContainer.style.animation = 'flagContainerReveal 0.8s ease-out 1.5s forwards';
            
            // Dévoiler le flag progressivement après l'apparition du conteneur
            setTimeout(() => {
                flagValue.textContent = flag;
                flagValue.style.animation = 'flagReveal 1.5s ease-out forwards';
            }, 3000);
        }, 5000);
    }

    // =======================
    // Animation d'erreur
    // =======================
    function showErrorAnimation(customMessage) {
        const overlay = document.getElementById('successOverlay');
        const successContainer = overlay.querySelector('.success-container');
        const successContent = overlay.querySelector('.success-content');
        const flagValue = document.getElementById('flagValue');
        const successTitle = overlay.querySelector('.success-title');
        const successSubtitle = overlay.querySelector('.success-subtitle');
        const successIcon = overlay.querySelector('.success-icon');
        const flagContainer = overlay.querySelector('.flag-container');
        
        // Réinitialiser l'overlay complètement
        overlay.classList.remove('show', 'error-mode');
        
        // Masquer le contenu initialement
        successContent.style.display = 'block';
        successContent.style.opacity = '0';
        
        // Configurer directement le message d'erreur AVANT d'afficher
        successTitle.textContent = 'OUPS RATÉ';
        successTitle.setAttribute('data-text', 'OUPS RATÉ');
        successTitle.style.color = '#ff0055';
        successTitle.style.textShadow = '0 0 10px #ff0055, 0 0 20px #ff0055';
        
        successSubtitle.textContent = customMessage || 'Les mots de passe ne correspondent pas';
        successSubtitle.style.color = '#ff4488';
        
        // Configurer l'icône en rouge
        successIcon.textContent = '✗';
        successIcon.style.color = '#ff0055';
        successIcon.style.textShadow = '0 0 20px #ff0055, 0 0 40px #ff0055, 0 0 60px #ff0055';
        
        // Masquer le conteneur du flag
        flagContainer.style.display = 'none';
        
        // Configurer le conteneur directement en mode erreur (rouge)
        successContainer.style.border = '3px solid #ff0055';
        successContainer.style.boxShadow = '0 0 60px rgba(255, 0, 85, 0.5), 0 0 120px rgba(255, 0, 85, 0.3), inset 0 0 60px rgba(255, 0, 85, 0.1)';
        successContainer.style.background = 'linear-gradient(135deg, rgba(74, 14, 14, 0.95), rgba(17, 5, 5, 0.98))';
        
        // Afficher l'overlay avec mode erreur IMMÉDIATEMENT
        overlay.classList.add('show', 'error-mode');
        
        // Animer l'apparition du contenu
        successContent.style.animation = 'slideUpFade 0.8s ease-out forwards';
        successIcon.style.animation = 'iconShake 0.3s ease-in-out infinite';
        
        // Son d'erreur
        errorSound.play();
        
        // Après 3 secondes, fermer et réinitialiser
        setTimeout(() => {
            overlay.classList.remove('show', 'error-mode');
            resetFormState();
            resetGame("Les mots de passe ne correspondent pas. Jeu réinitialisé.");
        }, 3000);
    }


    // =======================
    // Détection anti-triche (copier/coller, F12, clic droit, quitter page, Ctrl+N)
    // =======================
    const cheatPopup = document.getElementById('cheatPopup');
    const cheatButton = document.getElementById('cheatButton');
    const cheatMessage = document.getElementById('cheatMessage');
    const leavePopup = document.getElementById('leavePopup');
    const leaveButton = document.getElementById('leaveButton');
    
    function showCheatPopup(message) {
        if (message) {
            cheatMessage.textContent = message;
        }
        cheatPopup.classList.add('show');
        errorSound.play();
    }
    
    function hideCheatPopup() {
        cheatPopup.classList.remove('show');
    }
    
    cheatButton.addEventListener('click', hideCheatPopup);
    leaveButton.addEventListener('click', hideCheatPopup);
    
    // Désactiver le clic droit partout
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showCheatPopup();
        return false;
    });
    
    document.addEventListener('keydown', (e) => {
        // Détecter F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            showCheatPopup();
            return false;
        }
        
        // Détecter Alt+Tab (changement d'application)
        if (e.altKey && (e.key === 'Tab' || e.keyCode === 9)) {
            e.preventDefault();
            showCheatPopup('Tu ne peux pas changer d\'application !');
            return false;
        }
        
        // Détecter Alt+Shift+Tab (changement d'application inverse)
        if (e.altKey && e.shiftKey && (e.key === 'Tab' || e.keyCode === 9)) {
            e.preventDefault();
            showCheatPopup('Tu ne peux pas changer d\'application !');
            return false;
        }
        
        // Détecter Ctrl+N ou Cmd+N (nouvelle fenêtre/onglet)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'N' || e.key === 'n')) {
            e.preventDefault();
            showCheatPopup('Pourquoi tu veux ouvrir une nouvelle page ?');
            return false;
        }
        
        // Détecter Ctrl+Shift+I (Chrome DevTools)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
            e.preventDefault();
            showCheatPopup();
            return false;
        }
        
        // Détecter Ctrl+Shift+J (Console Chrome)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
            e.preventDefault();
            showCheatPopup();
            return false;
        }
        
        // Détecter Ctrl+U (voir le code source)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
            e.preventDefault();
            showCheatPopup();
            return false;
        }
        
        // Détecter Ctrl+T (nouvel onglet)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'T' || e.key === 't')) {
            e.preventDefault();
            showCheatPopup('Pourquoi tu veux ouvrir une nouvelle page ?');
            return false;
        }
        
        // Vérifier si Ctrl ou Cmd est pressé avec C, V ou X (copier/coller)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X')) {
            // Vérifier si on est dans un champ de mot de passe
            if (document.activeElement === passwordInput || document.activeElement === confirmInput) {
                e.preventDefault();
                showCheatPopup();
            }
        }
        
        // Détecter Ctrl+Shift+C (inspecteur Chrome)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
            showCheatPopup();
            return false;
        }
        
        // Détecter Ctrl+Shift+P (Command Palette DevTools)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
            e.preventDefault();
            showCheatPopup();
            return false;
        }
        
        // Détecter Ctrl+Shift+E (DevTools Network)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
            e.preventDefault();
            showCheatPopup();
            return false;
        }
        
        // Détecter Ctrl+Shift+N (mode navigation privée)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
            e.preventDefault();
            showCheatPopup('Tu ne peux pas ouvrir une navigation privée !');
            return false;
        }
        
        // Détecter Windows+D (desktop) - Meta key sur Mac
        if (e.metaKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            showCheatPopup('Tu ne peux pas accéder au bureau !');
            return false;
        }
        
        // Détecter Windows+L (verrouiller) - Meta key sur Mac
        if (e.metaKey && (e.key === 'l' || e.key === 'L')) {
            e.preventDefault();
            showCheatPopup('Tu ne peux pas verrouiller l\'ordinateur !');
            return false;
        }
        
        // Détecter Windows+Tab (vue des tâches) - Meta key sur Mac
        if (e.metaKey && (e.key === 'Tab' || e.keyCode === 9)) {
            e.preventDefault();
            showCheatPopup('Tu ne peux pas changer d\'application !');
            return false;
        }
        
        // Détecter Ctrl+H (historique)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'H' || e.key === 'h')) {
            e.preventDefault();
            showCheatPopup();
            return false;
        }
        
        // Détecter Ctrl+J (téléchargements)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'J' || e.key === 'j')) {
            e.preventDefault();
            showCheatPopup();
            return false;
        }
    });
    
    
    
    // =======================
    // Détection de la console DevTools ouverte
    // =======================
    let devtools = {
        open: false,
        orientation: null
    };
    
    const threshold = 160;
    
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                showCheatPopup('Ferme la console de développement !');
            }
        } else {
            if (devtools.open) {
                devtools.open = false;
            }
        }
    }, 500);
    
    // Détection supplémentaire via debugger et console
    let devtoolsDetected = false;
    
    const detectConsoleAdvanced = () => {
        const element = new Image();
        let detected = false;
        
        Object.defineProperty(element, 'id', {
            get: function() {
                if (!detected) {
                    detected = true;
                    if (!devtoolsDetected) {
                        devtoolsDetected = true;
                        showCheatPopup('Ferme la console de développement !');
                    }
                }
            }
        });
        
        // Utiliser requestAnimationFrame pour éviter le spam
        requestAnimationFrame(() => {
            devtoolsDetected = false;
            console.log(element);
            console.clear();
        });
    };
    
    // Vérifier périodiquement (toutes les 2 secondes)
    setInterval(detectConsoleAdvanced, 2000);
    
    // =======================
    // Règles de validation
    // =======================
    const rules = {
        length: { test: pwd => pwd.length >= 16, id: 'rule-length' },
        uppercase: { test: pwd => /[A-Z]/.test(pwd), id: 'rule-uppercase' },
        lowercase: { test: pwd => /[a-z]/.test(pwd), id: 'rule-lowercase' },
        digits: { test: pwd => (pwd.match(/\d/g) || []).length >= 2, id: 'rule-digits' },
        special: { test: pwd => (pwd.match(/[!@#$%^&*()_+\-={}[\]:;<>?]/g) || []).length >= 2, id: 'rule-special' },
        unicode: { test: pwd => /[^\x00-\x7F]/.test(pwd), id: 'rule-unicode' },
        repeat: { test: pwd => !/(.)\1{2,}/.test(pwd), id: 'rule-repeat' },
        sequence: { 
            test: pwd => {
                const pwdLower = pwd.toLowerCase();
                
                // Détecter les séquences alphabétiques consécutives (abc, bcd, xyz, etc.)
                for (let i = 0; i < pwdLower.length - 2; i++) {
                    const char1 = pwdLower.charCodeAt(i);
                    const char2 = pwdLower.charCodeAt(i + 1);
                    const char3 = pwdLower.charCodeAt(i + 2);
                    
                    // Vérifier si ce sont des lettres consécutives (ascendantes ou descendantes)
                    if (char1 >= 97 && char1 <= 122 && // a-z
                        char2 >= 97 && char2 <= 122 &&
                        char3 >= 97 && char3 <= 122) {
                        // Séquences ascendantes (abc, bcd, etc.)
                        if ((char2 === char1 + 1 && char3 === char2 + 1) ||
                            // Séquences descendantes (cba, dcb, etc.)
                            (char2 === char1 - 1 && char3 === char2 - 1)) {
                            return false; // Séquence détectée
                        }
                    }
                }
                
                // Détecter les séquences numériques consécutives (123, 234, 987, etc.)
                for (let i = 0; i < pwd.length - 2; i++) {
                    const char1 = pwd.charCodeAt(i);
                    const char2 = pwd.charCodeAt(i + 1);
                    const char3 = pwd.charCodeAt(i + 2);
                    
                    // Vérifier si ce sont des chiffres consécutifs
                    if (char1 >= 48 && char1 <= 57 && // 0-9
                        char2 >= 48 && char2 <= 57 &&
                        char3 >= 48 && char3 <= 57) {
                        // Séquences ascendantes (123, 234, etc.)
                        if ((char2 === char1 + 1 && char3 === char2 + 1) ||
                            // Séquences descendantes (321, 432, etc.)
                            (char2 === char1 - 1 && char3 === char2 - 1)) {
                            return false; // Séquence détectée
                        }
                    }
                }
                
                // Détecter les séquences de touches adjacentes sur clavier AZERTY
                const keyboardRows = [
                    'azertyuiop',
                    'qsdfghjklm',
                    'wxcvbn'
                ];
                
                // Vérifier les séquences horizontales (azert, qwerty, etc.)
                for (let row of keyboardRows) {
                    for (let i = 0; i < row.length - 2; i++) {
                        const seq = row.substring(i, i + 3);
                        if (pwdLower.includes(seq) || pwdLower.includes(seq.split('').reverse().join(''))) {
                            return false; // Séquence clavier détectée
                        }
                    }
                }
                
                // Vérifier aussi les séquences verticales (touches alignées verticalement)
                const keyboardCols = [
                    'aqw', 'zsx', 'edc', 'rfv', 'tgb', 'yhn', 'ujm', 'ik', 'ol', 'p'
                ];
                
                for (let col of keyboardCols) {
                    if (col.length >= 3) {
                        if (pwdLower.includes(col) || pwdLower.includes(col.split('').reverse().join(''))) {
                            return false; // Séquence verticale détectée
                        }
                    }
                }
                
                return true; // Aucune séquence détectée
            }, id: 'rule-sequence'
        }
    };

    // =======================
    // Vérification en temps réel
    // =======================
    function updateStrength() {
        const pwd = passwordInput.value;
        let validCount = 0;
        const totalRules = Object.keys(rules).length;

        Object.values(rules).forEach(rule => {
            const ruleElement = document.getElementById(rule.id);
            const isValid = rule.test(pwd);
            if(ruleElement) {
                if(isValid) ruleElement.classList.add('valid');
                else ruleElement.classList.remove('valid');
            }
            if(isValid) validCount++;
        });

        const percentage = Math.round((validCount / totalRules) * 100);
        strengthPercent.textContent = percentage + '%';

        strengthFill.className = 'strength-fill';
        if(percentage < 50) strengthFill.classList.add('weak');
        else if(percentage < 100) strengthFill.classList.add('medium');
        else strengthFill.classList.add('strong');

        strengthText.textContent = percentage === 100 ? 'Force : Conforme ✓' :
                                   percentage >= 50 ? 'Force : Moyen' : 'Force : Faible';

        // Le bouton reste toujours cliquable
        submitBtn.disabled = false;
    }

    passwordInput.addEventListener('input', updateStrength);
    confirmInput.addEventListener('input', updateStrength);

    // =======================
    // Soumission du formulaire
    // =======================
    const resetForm = document.getElementById('resetForm');
    if (!resetForm) {
        console.error('Formulaire resetForm introuvable !');
        return;
    }
    
    resetForm.addEventListener('submit', async e => {
        e.preventDefault();
        e.stopPropagation();

        const pwd = passwordInput.value;
        const confirm = confirmInput.value;

        if(pwd !== confirm) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            document.getElementById('btnText').style.display = 'none';
            showErrorAnimation('Les mots de passe ne correspondent pas');
            return;
        }
        
        const allRulesValid = Object.values(rules).every(rule => rule.test(pwd));
        if(!allRulesValid) {
            showErrorAnimation('Le mot de passe ne respecte pas toutes les contraintes.');
            errorSound.play();
            return;
        }

        // Vérifier que le token CSRF est disponible
        if (!csrfToken) {
            // Essayer de récupérer le token une dernière fois
            await getCSRFToken();
            if (!csrfToken) {
                showErrorAnimation('Erreur de sécurité. Veuillez recharger la page.');
                errorSound.play();
                resetFormState();
                return;
            }
        }

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        document.getElementById('btnText').style.display = 'none';

        try {
            // Utiliser POST au lieu de GET pour sécuriser le mot de passe
            const response = await fetch('api/get-flag.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include', // Inclure les cookies pour la session
                body: JSON.stringify({
                    password: pwd,
                    confirm_password: confirm,
                    csrf_token: csrfToken
                })
            });

            // Vérifier si la réponse est valide avant de parser le JSON
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                // Si le JSON ne peut pas être parsé, c'est probablement une erreur serveur
                showErrorAnimation('Erreur serveur. Veuillez réessayer.');
                errorSound.play();
                resetFormState();
                return;
            }

            // Mettre à jour le token CSRF si fourni
            if (data.csrf_token) {
                csrfToken = data.csrf_token;
            }

            if(data.success) {
                stopForm();
                successSound.play();
                showSuccessAnimation(data.flag, data.message);
            } else {
                // Gérer les erreurs spécifiques
                if (response.status === 429) {
                    showErrorAnimation('Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.');
                } else if (response.status === 403) {
                    showErrorAnimation('Requête invalide. Veuillez recharger la page.');
                    // Réinitialiser le token CSRF
                    csrfToken = '';
                    await getCSRFToken();
                } else if (response.status === 405) {
                    showErrorAnimation('Méthode non autorisée.');
                } else {
                    showErrorAnimation(data.message || 'Réinitialisation refusée.');
                }
                errorSound.play();
            }
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            showErrorAnimation("Erreur de communication avec le serveur.");
            errorSound.play();
        }
        resetFormState();
    });
});
