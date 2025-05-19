// src/pages/PopePage.jsx
import React from 'react';
import './PopePage.css';

const horseImages = [
  "https://cdn.britannica.com/96/1296-050-4A65097D/gelding-bay-coat.jpg",
  "https://signin.juliegoodnight.com/wp-content/uploads/2021/05/woodrow-rearing-square.jpg",
  "https://b1195915.smushcdn.com/1195915/wp-content/uploads/2024/03/newt-face-2.jpg?lossy=2&strip=1&webp=1",
  "https://s3.amazonaws.com/wp-s3-equusmagazine.com/wp-content/uploads/2021/11/29100305/two-horse-friends-scaled.jpg",
  "https://images.prismic.io/horsesoficeland/Zr8ua0aF0TcGI_gN_BMTH-2024-Mi%C3%B0hraun-the-gang-1.jpg?ixlib=gatsbyFP&auto=format%2Ccompress&fit=max&rect=0%2C183%2C4666%2C2745&w=1190&h=700",
  "https://s3.amazonaws.com/wp-s3-thehorse.com/wp-content/uploads/2017/09/22200722/chestnut-horse-playing-in-paddock-1024x683.jpg",
  "https://media.discordapp.net/attachments/1336180768384356352/1373872387719827466/3544531.gif?ex=682bfdde&is=682aac5e&hm=18b52268a64bc3ab990f6de1e863584ced4382c79b7e57700b7c9e3bd1c2702b&=&width=729&height=788",
  "https://media.discordapp.net/attachments/1336180768384356352/1373872585883779072/horse_fear.png?ex=682bfe0d&is=682aac8d&hm=d604580b617c93574a0f857218f2ca2dcefcc397b82a6eb8e46b3d927e10a6a3&=&format=webp&quality=lossless&width=487&height=684",
  "https://cdn.discordapp.com/attachments/1336180768384356352/1373872586689351700/Untitled.png?ex=682bfe0d&is=682aac8d&hm=f3b4d983bc1edb44d5044ba81d713ae0413e24ddfba2e068178eb9e63fa2358e&",
  "https://cdn.discordapp.com/attachments/1336180768384356352/1373872587934793728/EmI64aEXEAA2fzG.jpg?ex=682bfe0e&is=682aac8e&hm=b95d4a83706e21f6350bccd2cfa80589d53d05f0c1b0dc03f28e8b28589515db&",
  "https://cdn.discordapp.com/attachments/1336180768384356352/1373872586957656064/goodnight_horse.png?ex=682bfe0e&is=682aac8e&hm=a25561caa9e4a4f5c8731c1e65efc1fcc934955a9e98b43295de77eee6c902df&",
  "https://cdn.discordapp.com/attachments/1336180768384356352/1373872588190777485/FL4NzgtUYAQQkGJ.jpg?ex=682bfe0e&is=682aac8e&hm=39a2da6e3f4c6f42d39d55c16afe54831d09639b945908ccae9861412bf5ce26&",
  "https://cdn.discordapp.com/attachments/1336180768384356352/1373872587469488138/FcOJI-MaUAAPDLD.jpg?ex=682bfe0e&is=682aac8e&hm=10c47da54cb9bcbe90289df779ab514b38dd288d3ba282923561791bf637a812&",
  "https://cdn.discordapp.com/attachments/1336180768384356352/1373872587217698886/GRkuWZHWsAAWkku.jpg?ex=682bfe0e&is=682aac8e&hm=a39491a3519ca7fab922ea9ab3efdd5438e441b506eff0e093b704731c8410ab&"
];

function PopePage() {
  return (
    <div className="page-content pope-page-container">
      <h1>All The Pope's Horses</h1>
      <div className="horse-gallery">
        {horseImages.map((src, index) => (
          <div key={index} className="horse-image-container">
            <img src={src} alt={`Horse ${index + 1}`} className="horse-image" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default PopePage;
