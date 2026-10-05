/**
 * Abacus Mathematical Engine & Model
 * Supports:
 * - Soroban (Japanese 4+1 bi-quinary abacus)
 * - Suanpan (Chinese 5+2 bi-quinary abacus)
 * - Roman Handabacus (Roman 4+1 grooved calculi)
 * - Schoty (Russian 10-bead decimal abacus)
 * - Bidirectional Roman/Decimal converter
 * - Step-by-step Soroban complement rules ("Friends of 5 and 10")
 */

class AbacusEngine {
  constructor(rods = 6, type = 'soroban') {
    this.rods = rods; // Number of columns (1 to 12)
    this.type = type; // 'soroban', 'suanpan', 'roman', 'schoty'
    this.columns = []; // Bead state per column
    this.initColumns();
  }

  // Returns configuration for each abacus type
  getConfig() {
    switch (this.type) {
      case 'suanpan':
        return { upperBeads: 2, lowerBeads: 5, upperVal: 5, lowerVal: 1, maxColVal: 15, name: 'Suanpan (Chinesisch, 5+2)' };
      case 'roman':
        return { upperBeads: 1, lowerBeads: 4, upperVal: 5, lowerVal: 1, maxColVal: 9, name: 'Römischer Handabakus (4+1)' };
      case 'schoty':
        return { upperBeads: 0, lowerBeads: 10, upperVal: 0, lowerVal: 1, maxColVal: 10, name: 'Russischer Schoty / Schulabakus (10)' };
      case 'soroban':
      default:
        return { upperBeads: 1, lowerBeads: 4, upperVal: 5, lowerVal: 1, maxColVal: 9, name: 'Soroban (Japanisch, 4+1)' };
    }
  }

  initColumns() {
    const config = this.getConfig();
    this.columns = [];
    for (let c = 0; c < this.rods; c++) {
      this.columns.push({
        upperActive: 0, // Number of upper beads pushed toward separator
        lowerActive: 0  // Number of lower beads pushed toward separator
      });
    }
  }

  setRods(newRods) {
    const currentVal = this.getValue();
    this.rods = Math.max(3, Math.min(12, newRods));
    this.initColumns();
    this.setValue(currentVal);
  }

  setType(newType) {
    const currentVal = this.getValue();
    this.type = newType;
    this.initColumns();
    this.setValue(currentVal);
  }

  clear() {
    for (let c = 0; c < this.rods; c++) {
      this.columns[c].upperActive = 0;
      this.columns[c].lowerActive = 0;
    }
  }

  // Calculate current total numerical value (columns are index 0 = rightmost / 10^0)
  getValue() {
    const config = this.getConfig();
    let total = 0n;
    for (let i = 0; i < this.rods; i++) {
      const col = this.columns[i];
      const colVal = BigInt(col.upperActive * config.upperVal + col.lowerActive * config.lowerVal);
      const placeMultiplier = 10n ** BigInt(i);
      total += colVal * placeMultiplier;
    }
    return total;
  }

  // Set total numerical value onto the abacus
  setValue(val) {
    this.clear();
    let n = BigInt(val || 0);
    if (n < 0n) n = 0n;

    const config = this.getConfig();

    for (let i = 0; i < this.rods; i++) {
      if (n === 0n && i > 0) break;
      const digit = Number(n % 10n);
      n = n / 10n;

      if (this.type === 'schoty') {
        this.columns[i].lowerActive = Math.min(10, digit);
      } else {
        if (digit >= 5) {
          this.columns[i].upperActive = 1;
          this.columns[i].lowerActive = digit - 5;
        } else {
          this.columns[i].upperActive = 0;
          this.columns[i].lowerActive = digit;
        }
      }
    }
  }

  // Toggle upper bead in column (0 = rightmost)
  toggleUpper(colIdx, beadIdx = 0) {
    const col = this.columns[colIdx];
    const config = this.getConfig();
    if (!col || config.upperBeads === 0) return false;

    // In Soroban / Suanpan, beads towards separator are active
    // If clicking an active bead, deactivate it and any bead further from separator
    // If clicking an inactive bead, activate it and any bead closer to separator
    if (beadIdx < col.upperActive) {
      col.upperActive = beadIdx;
    } else {
      col.upperActive = Math.min(config.upperBeads, beadIdx + 1);
    }
    return true;
  }

  // Toggle lower bead in column
  toggleLower(colIdx, beadIdx = 0) {
    const col = this.columns[colIdx];
    const config = this.getConfig();
    if (!col) return false;

    // beadIdx is 0 (closest to beam) to config.lowerBeads - 1
    if (beadIdx < col.lowerActive) {
      col.lowerActive = beadIdx;
    } else {
      col.lowerActive = Math.min(config.lowerBeads, beadIdx + 1);
    }
    return true;
  }

  // Place value breakdown string: e.g. "2 x 10³ + 0 x 10² + 2 x 10¹ + 6 x 10⁰"
  getPlaceValueBreakdown() {
    const parts = [];
    const config = this.getConfig();
    let hasNonZero = false;

    for (let i = this.rods - 1; i >= 0; i--) {
      const col = this.columns[i];
      const digit = col.upperActive * config.upperVal + col.lowerActive * config.lowerVal;
      if (digit > 0) hasNonZero = true;

      if (hasNonZero || i === 0) {
        const exponent = i;
        const sup = this.toSuperscript(exponent);
        parts.push(`<span class="pv-digit">${digit}</span> × 10${sup}`);
      }
    }
    return parts.join(' + ');
  }

  toSuperscript(num) {
    const supMap = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(num).split('').map(c => supMap[c] || c).join('');
  }

  // Convert decimal integer to Roman Numeral (1 to 4999 standard, extended with overline if larger)
  static toRoman(num) {
    let n = Number(num);
    if (!n || n <= 0) return '—';
    if (n > 4999) return `(N > 4999: ${n})`; // Classical Roman range limit

    const romanNumerals = [
      { val: 1000, sym: 'M' },
      { val: 900, sym: 'CM' },
      { val: 500, sym: 'D' },
      { val: 400, sym: 'CD' },
      { val: 100, sym: 'C' },
      { val: 90, sym: 'XC' },
      { val: 50, sym: 'L' },
      { val: 40, sym: 'XL' },
      { val: 10, sym: 'X' },
      { val: 9, sym: 'IX' },
      { val: 5, sym: 'V' },
      { val: 4, sym: 'IV' },
      { val: 1, sym: 'I' }
    ];

    let result = '';
    for (const item of romanNumerals) {
      while (n >= item.val) {
        result += item.sym;
        n -= item.val;
      }
    }
    return result;
  }

  // Parse Roman Numeral to decimal integer
  static fromRoman(roman) {
    if (!roman) return 0;
    const clean = roman.trim().toUpperCase();
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    let prev = 0;

    for (let i = clean.length - 1; i >= 0; i--) {
      const char = clean[i];
      const val = map[char];
      if (!val) return 0; // Invalid Roman character

      if (val < prev) {
        total -= val;
      } else {
        total += val;
        prev = val;
      }
    }
    // Verify standard canonical Roman representation
    if (AbacusEngine.toRoman(total) !== clean && total <= 4999) {
      // Allow lenient parsing, but valid integer
    }
    return total;
  }

  // Soroban Addition Complement Rule Generator ("Little Friends" & "Big Friends")
  static getAdditionAdvice(currentDigit, addDigit) {
    if (currentDigit + addDigit <= 4) {
      return { rule: 'Direkte Addition', desc: `Schiebe einfach ${addDigit} untere Perle(n) nach oben zum Trennstab.` };
    }
    // Little friends (5's complement): currentDigit < 5 and adding would cross 5 without carry
    if (currentDigit < 5 && currentDigit + addDigit < 10 && currentDigit + addDigit >= 5) {
      const complement = 5 - addDigit;
      return {
        rule: '5er-Komplement (Little Friend)',
        desc: `Schiebe obere 5er-Perle hinunter (+5) und ziehe ${complement} untere Perle(n) ab (-${complement}).`
      };
    }
    // Big friends (10's complement): crosses 10
    if (currentDigit + addDigit >= 10) {
      const complement = 10 - addDigit;
      return {
        rule: '10er-Übertrag (Big Friend)',
        desc: `Ziehe ${complement} an dieser Stelle ab (-${complement}) und schiebe 1 auf der nächsten Stelle links nach oben (+10).`
      };
    }
    return { rule: 'Direkte Bewegung', desc: 'Perlen entsprechend hinzufügen.' };
  }
}
