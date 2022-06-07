package info.interactivesystems.movielandscape.security;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

class SecurityUtils {
    static byte[] getSalt() {
	try {
	    SecureRandom sr = SecureRandom.getInstance("SHA1PRNG");
	    byte[] salt = new byte[16];
	    sr.nextBytes(salt);
	    return salt;
	} catch (NoSuchAlgorithmException e) {
	    throw new AlgorithmUnknownException(e);
	}
    }

    static String getSecurePassword(String passwordToHash, byte[] salt) {
	try {
	    MessageDigest md = MessageDigest.getInstance("MD5");
	    md.update(salt);
	    byte[] bytes = md.digest(passwordToHash.getBytes());
	    // This bytes[] has bytes in decimal format;
	    // Convert it to hexadecimal format
	    StringBuilder sb = new StringBuilder();
	    for (int i = 0; i < bytes.length; i++) {
		sb.append(Integer.toString((bytes[i] & 0xff) + 0x100, 16).substring(1));
	    }
	    // Get complete hashed password in hex format
	    String generatedPassword = sb.toString();
	    return generatedPassword;
	} catch (NoSuchAlgorithmException e) {
	    throw new AlgorithmUnknownException(e);
	}
    }
    
    static class AlgorithmUnknownException extends RuntimeException {
	private static final long serialVersionUID = 771696885532144988L;

	AlgorithmUnknownException(Throwable cause){
	    super("Algorithm unkonwn", cause);
	}
    }

}
