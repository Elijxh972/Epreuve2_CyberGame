<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Récupération du mot de passe depuis GET (car le JS envoie en GET)
$password = $_GET['password'] ?? '';

if (!$password) {
    echo json_encode([
        'success' => false,
        'message' => 'Requête invalide.'
    ]);
    exit;
}

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
    
    return false; // Aucune séquence détectée
}

function validatePassword(string $pwd): array {
    $errors = [];

    if (mb_strlen($pwd, 'UTF-8') < 16)
        $errors[] = "Minimum 16 caractères";

    if (!preg_match('/[A-Z]/', $pwd))
        $errors[] = "Au moins 1 majuscule";

    if (!preg_match('/[a-z]/', $pwd))
        $errors[] = "Au moins 1 minuscule";

    if (preg_match_all('/\d/', $pwd) < 2)
        $errors[] = "Au moins 2 chiffres";

    if (preg_match_all('/[!@#$%^&*()_+\-=\[\]{}:;<>?]/', $pwd) < 2)
        $errors[] = "Au moins 2 caractères spéciaux";

    if (!preg_match('/[^\x00-\x7F]/', $pwd))
        $errors[] = "Au moins 1 caractère Unicode";

    if (preg_match('/(.)\1{2,}/u', $pwd))
        $errors[] = "Pas de répétition excessive";

    if (containsSequentialChars($pwd))
        $errors[] = "Pas de suites évidentes";

    return $errors;
}

$errors = validatePassword($password);

if (empty($errors)) {
    echo json_encode([
        'success' => true,
        'message' => 'Accès administrateur récupéré.',
        'flag' => 'FLAG-LUMEN-02'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Mot de passe invalide : ' . implode(', ', $errors)
    ]);
}
