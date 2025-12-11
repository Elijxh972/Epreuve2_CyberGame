<?php
session_start();

// =======================
// Mot de passe en dur (hardcodé)
// =======================
$HARDCODED_PASSWORD = 'Sécur1té@2024!Mdp#Très$Complexe&UnicodeΩ';

// Forcer HTTPS pour sécuriser les données en transit
if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
    // En production, rediriger vers HTTPS
    // En développement local, on peut être plus permissif
    $isLocalhost = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1', 'localhost:8080', '127.0.0.1:8080']);
    if (!$isLocalhost) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'HTTPS requis pour la sécurité.'
        ]);
        exit;
    }
}

header('Content-Type: application/json');

// Configuration CORS sécurisée - autoriser uniquement les origines spécifiques
$allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Si pas d'origine ou origine non autorisée, ne pas autoriser CORS
    header('Access-Control-Allow-Origin: null');
}

header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Access-Control-Allow-Credentials: true');

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Accepter uniquement les requêtes POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée.'
    ]);
    exit;
}

// =======================
// Rate Limiting / Protection Brute Force
// =======================
function checkRateLimit($ip) {
    $rateLimitFile = __DIR__ . '/../logs/rate_limit_' . md5($ip) . '.json';
    $maxAttempts = 5; // Maximum 5 tentatives
    $timeWindow = 300; // Fenêtre de 5 minutes (300 secondes)
    
    // Créer le dossier logs s'il n'existe pas
    $logsDir = __DIR__ . '/../logs';
    if (!is_dir($logsDir)) {
        mkdir($logsDir, 0755, true);
    }
    
    $now = time();
    $attempts = [];
    
    if (file_exists($rateLimitFile)) {
        $data = json_decode(file_get_contents($rateLimitFile), true);
        if ($data) {
            // Filtrer les tentatives dans la fenêtre de temps
            $attempts = array_filter($data['attempts'] ?? [], function($timestamp) use ($now, $timeWindow) {
                return ($now - $timestamp) < $timeWindow;
            });
        }
    }
    
    // Vérifier si la limite est dépassée
    if (count($attempts) >= $maxAttempts) {
        $oldestAttempt = !empty($attempts) ? min($attempts) : $now;
        return [
            'allowed' => false,
            'retry_after' => $timeWindow - ($now - $oldestAttempt)
        ];
    }
    
    // Ajouter la tentative actuelle
    $attempts[] = $now;
    file_put_contents($rateLimitFile, json_encode([
        'ip' => $ip,
        'attempts' => array_values($attempts),
        'last_attempt' => $now
    ]));
    
    return ['allowed' => true];
}

$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitCheck = checkRateLimit($clientIp);

if (!$rateLimitCheck['allowed']) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Trop de tentatives. Veuillez réessayer plus tard.'
    ]);
    exit;
}

// =======================
// Vérification CSRF Token
// =======================
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// =======================
// Journalisation des tentatives
// =======================
function logAttempt($ip, $password, $success, $reason = '') {
    $logsDir = __DIR__ . '/../logs';
    if (!is_dir($logsDir)) {
        mkdir($logsDir, 0755, true);
    }
    
    $logFile = $logsDir . '/attempts_' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $passwordHash = substr(hash('sha256', $password), 0, 16); // Hash partiel pour logs
    $status = $success ? 'SUCCESS' : 'FAILED';
    $logEntry = "[$timestamp] IP: $ip | Status: $status | Password Hash: $passwordHash | Reason: $reason\n";
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// =======================
// Récupération des données POST
// =======================
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

// Si c'est une requête pour obtenir le token CSRF uniquement
if (isset($input['action']) && $input['action'] === 'get_token') {
    generateCSRFToken();
    echo json_encode([
        'success' => true,
        'csrf_token' => $_SESSION['csrf_token']
    ]);
    exit;
}

// Pour les autres requêtes, vérifier le CSRF
$csrfToken = $input['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
$sessionToken = $_SESSION['csrf_token'] ?? '';

if (empty($sessionToken)) {
    // Générer un token pour la première requête
    generateCSRFToken();
} elseif (!hash_equals($sessionToken, $csrfToken)) {
    // Token CSRF invalide
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Requête invalide.'
    ]);
    exit;
}

$password = $input['password'] ?? '';
$confirmPassword = $input['confirm_password'] ?? '';

// Validation de base
if (empty($password)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Requête invalide.'
    ]);
    exit;
}

// Vérifier la confirmation du mot de passe côté serveur
if ($password !== $confirmPassword) {
    logAttempt($clientIp, $password, false, 'Mots de passe non identiques');
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Les mots de passe ne correspondent pas.'
    ]);
    exit;
}

// =======================
// Validation Unicode stricte
// =======================
function isValidUnicodeChar($char) {
    $code = mb_ord($char, 'UTF-8');
    
    // Si mb_ord retourne false, le caractère est invalide
    if ($code === false) {
        return false;
    }
    
    // Rejeter les caractères de contrôle (sauf espaces)
    if ($code < 32 && $code !== 9 && $code !== 10 && $code !== 13) {
        return false;
    }
    
    // Rejeter les caractères de remplacement et autres caractères problématiques
    if ($code === 0xFFFD || ($code >= 0xE000 && $code <= 0xF8FF)) {
        return false;
    }
    
    // Accepter uniquement les caractères Unicode valides et visibles
    // Plages acceptées : lettres, chiffres, symboles, ponctuation
    return (
        ($code >= 0x0020 && $code <= 0x007E) || // ASCII imprimable
        ($code >= 0x00A0 && $code <= 0x024F) || // Latin étendu
        ($code >= 0x1E00 && $code <= 0x1EFF) || // Latin étendu supplémentaire
        ($code >= 0x0370 && $code <= 0x03FF) || // Grec
        ($code >= 0x0400 && $code <= 0x04FF) || // Cyrillique
        ($code >= 0x2000 && $code <= 0x206F) || // Ponctuation générale
        ($code >= 0x2070 && $code <= 0x209F) || // Indices et exposants
        ($code >= 0x20A0 && $code <= 0x20CF) || // Symboles monétaires
        ($code >= 0x2100 && $code <= 0x214F) || // Symboles lettrés
        ($code >= 0x2190 && $code <= 0x21FF) || // Flèches
        ($code >= 0x2200 && $code <= 0x22FF) || // Opérateurs mathématiques
        ($code >= 0x2300 && $code <= 0x23FF) || // Symboles techniques
        ($code >= 0x2400 && $code <= 0x243F) || // Symboles de contrôle
        ($code >= 0x2500 && $code <= 0x257F) || // Box drawing
        ($code >= 0x2580 && $code <= 0x259F) || // Block elements
        ($code >= 0x25A0 && $code <= 0x25FF) || // Formes géométriques
        ($code >= 0x2600 && $code <= 0x26FF) || // Symboles divers
        ($code >= 0x2700 && $code <= 0x27BF) || // Dingbats
        ($code >= 0x3000 && $code <= 0x303F) || // Symboles CJK
        ($code >= 0x3040 && $code <= 0x309F) || // Hiragana
        ($code >= 0x30A0 && $code <= 0x30FF) || // Katakana
        ($code >= 0x4E00 && $code <= 0x9FFF) || // CJK Unified Ideographs
        ($code >= 0xAC00 && $code <= 0xD7AF)    // Hangul
    );
}

function validateUnicodeChars($pwd) {
    $len = mb_strlen($pwd, 'UTF-8');
    for ($i = 0; $i < $len; $i++) {
        $char = mb_substr($pwd, $i, 1, 'UTF-8');
        if (!isValidUnicodeChar($char)) {
            return false;
        }
    }
    return true;
}

// =======================
// Détection de séquences renforcée
// =======================
function containsSequentialChars(string $pwd): bool {
    $pwdLower = mb_strtolower($pwd, 'UTF-8');
    $len = mb_strlen($pwdLower, 'UTF-8');

    // Détecter les séquences alphabétiques consécutives (abc, bcd, xyz, etc.) - 3 caractères minimum
    for ($i = 0; $i <= $len - 3; $i++) {
        $char1 = ord(mb_substr($pwdLower, $i, 1, 'UTF-8'));
        $char2 = ord(mb_substr($pwdLower, $i + 1, 1, 'UTF-8'));
        $char3 = ord(mb_substr($pwdLower, $i + 2, 1, 'UTF-8'));
        
        // Vérifier si ce sont des lettres consécutives (ascendantes ou descendantes)
        if ($char1 >= 97 && $char1 <= 122 && // a-z
            $char2 >= 97 && $char2 <= 122 &&
            $char3 >= 97 && $char3 <= 122) {
            // Séquences ascendantes (abc, bcd, etc.) ou descendantes (cba, dcb, etc.)
            if (($char2 === $char1 + 1 && $char3 === $char2 + 1) ||
                ($char2 === $char1 - 1 && $char3 === $char2 - 1)) {
                return true; // Séquence détectée
            }
        }
    }
    
    // Détecter les séquences numériques consécutives (123, 234, 987, etc.) - 3 caractères minimum
    $pwdLen = mb_strlen($pwd, 'UTF-8');
    for ($i = 0; $i <= $pwdLen - 3; $i++) {
        $char1 = ord(mb_substr($pwd, $i, 1, 'UTF-8'));
        $char2 = ord(mb_substr($pwd, $i + 1, 1, 'UTF-8'));
        $char3 = ord(mb_substr($pwd, $i + 2, 1, 'UTF-8'));
        
        // Vérifier si ce sont des chiffres consécutifs
        if ($char1 >= 48 && $char1 <= 57 && // 0-9
            $char2 >= 48 && $char2 <= 57 &&
            $char3 >= 48 && $char3 <= 57) {
            // Séquences ascendantes (123, 234, etc.) ou descendantes (321, 432, etc.)
            if (($char2 === $char1 + 1 && $char3 === $char2 + 1) ||
                ($char2 === $char1 - 1 && $char3 === $char2 - 1)) {
                return true; // Séquence détectée
            }
        }
    }
    
    // Détecter les séquences de touches adjacentes sur clavier AZERTY
    $keyboardRows = [
        'azertyuiop',
        'qsdfghjklm',
        'wxcvbn'
    ];
    
    // Vérifier les séquences horizontales (azert, qwerty, etc.)
    foreach ($keyboardRows as $row) {
        $rowLen = mb_strlen($row, 'UTF-8');
        for ($i = 0; $i <= $rowLen - 3; $i++) {
            $seq = mb_substr($row, $i, 3, 'UTF-8');
            $seqReverse = strrev($seq);
            if (mb_stripos($pwdLower, $seq, 0, 'UTF-8') !== false || 
                mb_stripos($pwdLower, $seqReverse, 0, 'UTF-8') !== false) {
                return true; // Séquence clavier détectée
            }
        }
    }
    
    // Vérifier aussi les séquences verticales (touches alignées verticalement)
    $keyboardCols = [
        'aqw', 'zsx', 'edc', 'rfv', 'tgb', 'yhn', 'ujm', 'ik', 'ol', 'p'
    ];
    
    foreach ($keyboardCols as $col) {
        if (mb_strlen($col, 'UTF-8') >= 3) {
            $colReverse = strrev($col);
            if (mb_stripos($pwdLower, $col, 0, 'UTF-8') !== false || 
                mb_stripos($pwdLower, $colReverse, 0, 'UTF-8') !== false) {
                return true; // Séquence verticale détectée
            }
        }
    }
    
    // Détecter les séquences de 2 caractères répétées (aa, bb, 11, 22, etc.)
    for ($i = 0; $i < $len - 1; $i++) {
        $char1 = mb_substr($pwdLower, $i, 1, 'UTF-8');
        $char2 = mb_substr($pwdLower, $i + 1, 1, 'UTF-8');
        if ($char1 === $char2) {
            // Vérifier si c'est une séquence de touches adjacentes
            foreach ($keyboardRows as $row) {
                $pos = mb_stripos($row, $char1, 0, 'UTF-8');
                if ($pos !== false && $pos < mb_strlen($row, 'UTF-8') - 1) {
                    $nextChar = mb_substr($row, $pos + 1, 1, 'UTF-8');
                    if ($char2 === $nextChar) {
                        return true; // Séquence de touches adjacentes détectée
                    }
                }
            }
        }
    }
    
    return false; // Aucune séquence détectée
}

// =======================
// Validation du mot de passe
// =======================
function validatePassword(string $pwd): array {
    $errors = [];

    if (mb_strlen($pwd, 'UTF-8') < 16)
        $errors[] = "length";

    if (!preg_match('/[A-Z]/', $pwd))
        $errors[] = "uppercase";

    if (!preg_match('/[a-z]/', $pwd))
        $errors[] = "lowercase";

    if (preg_match_all('/\d/', $pwd) < 2)
        $errors[] = "digits";

    if (preg_match_all('/[!@#$%^&*()_+\-=\[\]{}:;<>?]/', $pwd) < 2)
        $errors[] = "special";

    if (!preg_match('/[^\x00-\x7F]/', $pwd))
        $errors[] = "unicode";

    if (preg_match('/(.)\1{2,}/u', $pwd))
        $errors[] = "repeat";

    if (containsSequentialChars($pwd))
        $errors[] = "sequence";
    
    // Validation Unicode stricte
    if (!validateUnicodeChars($pwd))
        $errors[] = "unicode_invalid";

    return $errors;
}

$errors = validatePassword($password);

// Vérifier que le mot de passe correspond au mot de passe en dur
if (empty($errors)) {
    // Comparaison stricte du mot de passe avec le mot de passe en dur
    if (!hash_equals($HARDCODED_PASSWORD, $password)) {
        logAttempt($clientIp, $password, false, 'Mot de passe incorrect');
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Le mot de passe ne respecte pas les critères de sécurité requis.'
        ]);
        exit;
    }
    
    // Mot de passe correct
    logAttempt($clientIp, $password, true, 'Mot de passe correct');
    
    // Générer un nouveau token CSRF après succès
    generateCSRFToken();
    
    echo json_encode([
        'success' => true,
        'message' => 'Accès administrateur récupéré.',
        'flag' => 'FLAG-LUMEN-02',
        'csrf_token' => $_SESSION['csrf_token'] // Renvoyer le token pour les prochaines requêtes
    ]);
} else {
    logAttempt($clientIp, $password, false, 'Validation échouée');
    
    // Ne pas révéler les détails des erreurs - message générique
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Le mot de passe ne respecte pas les critères de sécurité requis.'
    ]);
}
