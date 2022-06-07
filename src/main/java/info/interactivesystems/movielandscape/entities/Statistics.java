package info.interactivesystems.movielandscape.entities;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.persistence.CollectionTable;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.SequenceGenerator;
import javax.transaction.Transactional;

@Entity
public class Statistics implements Serializable{
    private static final long serialVersionUID = 7641486390951289079L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "statistics_seq")
    @SequenceGenerator(name = "statistics_seq", sequenceName = "statistics_seq")
    private long id;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name="logins", joinColumns=@JoinColumn(name="statistics_id", referencedColumnName="id"))
    @Column(name = "date")
    private List<Date> logins;
    
    public Statistics() {
	super();
	logins = new ArrayList<>();
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public List<Date> getLogins() {
        return logins;
    }

    public void setLogins(List<Date> logins) {
        this.logins = logins;
    }
    
    public void addLogin(Date login) {
	logins.add(login);
    }
    
    public int getNumberLogins() {
	return logins.size();
    }
    
    public Date getLastLogin() {
	if(logins.size() > 1) {
	    return logins.get(logins.size()-2);
	} else if (logins.size() > 0) {
	    return logins.get(logins.size()-1);
	}
	return null;
    }
    
}
