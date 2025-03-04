$(document).ready(() => {
  // Checks if given unicode hex is in the range from starting unicode hex to ending unicode hex
  const isUnicodeInRange = (hex, start, end) => {
    // Convert hexadecimals to decimal
    const unicodeVal = parseInt(hex, 16);
    const startVal = parseInt(start, 16);
    const endVal = parseInt(end, 16);

    // Check if the unicode value is within the range
    return unicodeVal >= startVal && unicodeVal <= endVal;
  };

  // Converts hexadecimal to binary
  const cvtHexToBinary = (hex) => {
    // Hex to decimal
    const decimal = parseInt(hex, 16);

    // Decimal to binary
    const binary = decimal.toString(2);

    // Pad the binary with zeroes in case of zero padding needed for numbers like 1 (0001)
    return binary.padStart(hex.length * 4, "0");
  };

  // Converts binary to hex
  const cvtBinaryToHex = (binary) => {
    // Binary to decimal
    const decimal = parseInt(binary, 2);

    // Decimal to hex
    const hex = decimal.toString(16).toUpperCase(); // Use .toUpperCase() for uppercase hex letters

    return hex;
  };

  // Converts hexadecimal to decimal
  const cvtHexToDec = (hex) => {
    // Hex to decimal
    const decimal = parseInt(hex, 16);

    return decimal;
  };

  // Converts decimal to hexadecimal
  const cvtDecToHex = (decimal) => {
    // Decimal to Hex
    const hex = decimal.toString(16);

    return hex;
  };

  // Adds two binaries
  const addBinary = (bin1, bin2) => {
    // Convert binaries to decimal
    const decimal1 = parseInt(bin1, 2);
    const decimal2 = parseInt(bin2, 2);

    // Add the decimals
    const sum = decimal1 + decimal2;

    // Convert back to binary
    return sum.toString(2);
  };

  // (.{2}) - Captures any two characters.
  // (?!$) - Ensures we're not at the end of the string.
  // /g - Makes the replacement apply to the whole string.
  // "$1 " - Replaces the matched two characters with themselves ($1) followed by a space.
  const addSpaceEveryNChar = (str, n) => {
    const regex = new RegExp(`(.{${n}})(?!$)`, "g");
    return str.replace(regex, "$1 ");
  };

  // Function to convert the Unicode Hexadecimal into UTF-8
  const cvtToUTF8 = (hex) => {
    // Format we're going to use to convert
    let format;

    // Variables that check which format the unicode should follow to convert to utf-8
    const isFormat1 = isUnicodeInRange(hex, "0000", "007F");
    const isFormat2 = isUnicodeInRange(hex, "0080", "07FF");
    const isFormat3 = isUnicodeInRange(hex, "0800", "FFFF");
    const isFormat4 = isUnicodeInRange(hex, "10000", "1FFFFF");

    // Assign format to follow based on unicode value
    if (isFormat1) format = ["0xxxxxxx"];
    if (isFormat2) format = ["110xxxxx", "10xxxxxx"];
    if (isFormat3) format = ["1110xxxx", "10xxxxxx", "10xxxxxx"];
    if (isFormat4) format = ["11110xxx", "10xxxxxx", "10xxxxxx", "10xxxxxx"];

    // Convert the unicode hex to binary
    const unicodeBinary = cvtHexToBinary(hex);

    // Start the index of the binary to copy from the very end of the binary.
    let unicodeBinaryIndex = unicodeBinary.length - 1;

    // Loop through the format array and start from the last 8 bits
    for (let i = format.length - 1; i >= 0; i--) {
      let currentFormat = format[i].split(""); // Convert string to array

      // Loop through the current bits of the format as long as we're going through x's
      for (let j = currentFormat.length - 1; currentFormat[j] === "x"; j--) {
        // If there's no more digits to add to the format, we just pad it with zeroes
        if (unicodeBinaryIndex < 0) {
          currentFormat[j] = "0";
        } else {
          currentFormat[j] = unicodeBinary[unicodeBinaryIndex]; // Replace current x with the last index of the unicodeBinary
          unicodeBinaryIndex--; // Move the index
        }
      }

      format[i] = currentFormat.join(""); // Convert array back to string
    }

    // Once all x's have been filled, join all the strings in the format array.
    const binaryFormat = format.join("");
    let utf8 = "";

    // Loop through the binary string and group the binary into 4. Then turn each 4-group into a hex.
    for (let i = 0; i < binaryFormat.length; i += 4) {
      // Get the 4 bits starting from the current index
      const currNibble = binaryFormat.slice(i, i + 4);

      // Convert the nibble to hex and add it to the utf8 string.
      utf8 += cvtBinaryToHex(currNibble);
    }

    // Return the utf8 string
    return utf8;
  };

  // Function to convert the Unicode Hexadecimal into UTF-16
  const cvtToUTF16 = (hex) => {
    // Check if the unicode is within U+0000 to U+FFFF
    const inBMP = isUnicodeInRange(hex, "0000", "FFFF");

    // If the unicode is within U+0000 to U+FFFF, return the hex as is
    if (inBMP) return hex;

    // Subtract the hex by 10000
    let subtractedHex = cvtDecToHex(cvtHexToDec(hex) - cvtHexToDec("10000"));

    // Pad the hex in case it ends up having 4 digits after the subtraction
    subtractedHex = subtractedHex.padStart(hex.length, "0");

    // Convert the hex to binary
    const hexBinary = cvtHexToBinary(subtractedHex);

    // Add upper bits to D800 (done in binary to avoid padding errors)
    const upperBinary = addBinary(
      hexBinary.slice(0, 10),
      cvtHexToBinary("D800")
    );

    // Add lower bits to DC00 (done in binary to avoid padding errors)
    const lowerBinary = addBinary(
      hexBinary.slice(10, hexBinary.length),
      cvtHexToBinary("DC00")
    );

    // Combine upper and lower binary and convert to hex.
    const utf16 = cvtBinaryToHex(`${upperBinary}${lowerBinary}`);
    return utf16;
  };

  // Function to convert the UTF into UTF-32
  const cvtToUTF32 = (hex) => {
    // Simply pad the hex with zeroes until there's 8 digits.
    return hex.padStart(8, "0");
  };

  // Submit event (when the convert-utf button is clicked), when the user submits unicode
  $("#convert-utf").click(function () {
    let input = $("#utf-input").val().trim();
    // \d means digit from 0 to 9
    // {0,5} means either 0 to 5 digit combinations of a-f, A-F, and/or 0 to 9
    // | means OR
    // {4} means exactly 4 digits required combinations of a-f, A-F, and/or 0 to 9
    const validInput = /^([\da-fA-F]{0,5}|10[\da-fA-F]{4})$/.test(input);

    // If invalid, display error and do not do anything
    if (!validInput) {
      $("#input-error").text(
        "Your Unicode is invalid. Valid Unicodes range from U+0000 to U+10FFFF"
      );

      // Clear the previous results
      $("#utf8-result").text("");
      $("#utf16-result").text("");
      $("#utf32-result").text("");
      return;
    }

    // If empty string, make the input 0000
    if (input === "") input = "0000";

    // Clear previous error if the input is valid
    $("#input-error").text("");

    // Convert input to UTF8, UTF16, UTF32
    const utf8 = cvtToUTF8(input);
    const utf16 = cvtToUTF16(input);
    const utf32 = cvtToUTF32(input);

    // Display the results with proper formatting
    $("#utf8-result").text(addSpaceEveryNChar(utf8, 2));
    $("#utf16-result").text(addSpaceEveryNChar(utf16, 4));
    $("#utf32-result").text(addSpaceEveryNChar(utf32, 4));
  });

  // Copy to clipboard on-click event
  $("#copy-btn").click(function () {
    const result = `UTF-8: ${$("#utf8-result").text()}\nUTF-16: ${$(
      "#utf16-result"
    ).text()}\nUTF-32: ${$("#utf32-result").text()}\n`;

    // Copy the text inside the text field
    navigator.clipboard
      .writeText(result)
      .then(() => {
        $("#copy-btn").text("Copied to clipboard!");
        setTimeout(() => {
          $("#copy-btn").text("Copy Result to Clipboard");
        }, 1000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  });
});
