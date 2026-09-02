import React from 'react';

const About = () => {
  return (
    <div className="container section" style={{maxWidth: '800px', margin: '0 auto'}}>
      <h1 style={{textAlign: 'center', marginBottom: '32px'}}>About Mithila Ghar</h1>
      
      <div className="card" style={{padding: '32px', border: 'none'}}>
        <p style={{fontSize: '18px', lineHeight: '1.6', marginBottom: '16px'}}>
          Mithila Ghar is a dedicated marketplace focused entirely on preserving and promoting authentic Terai and Mithila products. 
        </p>
        <p style={{fontSize: '16px', lineHeight: '1.6', color: 'var(--muted)', marginBottom: '16px'}}>
          Our mission is to bring traditional foods, art, crafts, and ritual products directly from local artisans and small producers to your home, bridging the geographical gap for Nepalis everywhere.
        </p>
        
        <h3 style={{marginTop: '32px', marginBottom: '16px'}}>What We Offer</h3>
        <ul style={{lineHeight: '1.8', color: 'var(--ink)'}}>
          <li><strong>Food:</strong> Authentic, home-style recipes like Khajuri, Thekua, and locally made pickles.</li>
          <li><strong>Art &amp; Crafts:</strong> Genuine Madhubani paintings and handmade bamboo essentials.</li>
          <li><strong>Ritual Products:</strong> Curated kits containing all customary elements for festivals like Chhath and regular household pujas.</li>
        </ul >

        <p style={{marginTop: '32px', fontStyle: 'italic', fontWeight: 'bold'}}>
          By shopping at Mithila Ghar, you are actively supporting local artisans and keeping centuries-old traditions alive.
        </p>
      </div>
    </div>
  );
};

export default About;
