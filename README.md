# DGA 3.0

ไฟล์ใน Folder Github นี้ใช้สำหรับแยกในการตรวจสอบ VA SCAN โดย SONARQUBE เท่านั้น สำหรับลิงค์ใน GoogleDrive ต่อไปนี้จะมี Wordpress core basic ประกอบด้วยท่านสามารถอัพเดต Wordpress code ได้ตามปกติ
ระบบทำงานใน Hello ChildTheme จะไม่ได้รับผลกระทบใด ๆ สำหรับการอัพเดต

 Link download FULL Source code
 https://drive.google.com/drive/folders/1x82cRGAJ6U8kTqZp4RUDg0z17XqlIx88?usp=sharing

 ภายในโฟลเดอร์จะประกอบด้วย
 1. ไฟล์โปรแกรมทั้งหมด มี Wordpress core มาแล้วและมีฐานข้อมูล MySQL ขนาดไฟล์ 1.6 GB
 2. ไฟล์ทำงานหลัก  installer.php

ขั้นตอนการทำงาน
1. อัพโหลดไฟล์ installer.php ใน Public_html หรือ พาธในเซิฟเวอร์ของท่าน
2. อัพโหลดไฟล์ ZIP ขนาด 1.6 GB เอาวางเอาไว้ใน Level path เดียวกัน
3. เปิดหน้า Browser  แล้วเข้า URL "https://---- YourDomain ------ .com/installer.php
4. เตรียมฐานข้อมูล MySQL เปล่าเอาไว้ โดยสามารถกำหนด Username / password เอาไว้ได้เลย
5. นำ Username / password สำหรับเชื่อมต่อ MySQL นำมาใส่ในฟอร์มการติดตั้ง แล้วกด Next
6. ระบบจะทำสแกนสิ่งแวดล้อมของเซิฟเวอร์ของท่าน เพื่อตรวจสอบความพร้อม ในทุกข้อจำเป็นต้อง PASS เป็นสีเขียว
7. กดปุ่ม Validate ระบบจะทำการติดตั้งให้โดยอัตโนมัติ
