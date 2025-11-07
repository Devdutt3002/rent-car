import React from 'react';
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { IoLocation } from "react-icons/io5";
import { BsTelephoneFill } from "react-icons/bs";
import { GrMail } from "react-icons/gr";
import { BiLogoFacebook, BiLogoLinkedin } from "react-icons/bi";
import { AiFillInstagram, AiOutlineTwitter } from "react-icons/ai";
import { useLocation } from "react-router-dom";


const Footer = () => {

  const location = useLocation();

  return <>
    {
      !location.pathname.includes("admin") &&
      <footer id="footer" className="secondary-bg-color">
        <Container className="pt-3 pb-2">
          <Row>
            <Col>
              <h1 className="fs-1 text-center quinary-color">TryCAR</h1>
            </Col>
          </Row>
          <Row>
            <Col>
              <Row>
                <Col>
                  <h4 className="fs-4 text-white fw-700">Subscribe Now</h4>
                  <p className="fs-6 text-white m-0 mb-1">subscribe for more features</p>
                  <div className="form-group">
                    <Form.Control as="textarea" rows={1} placeholder="Enter Your Email" />
                    <Button variant="primary" className="primary-bg-color border-0 w-100 mt-1">Subscribe</Button>
                  </div>
                </Col>
                <Col>
                  <h4 className="fs-4 text-white fw-700">Information</h4>
                  <p className="fs-6 text-white m-0">This car rental system </p>
                </Col>
                <Col>
                  <h4 className="fs-4 text-white fw-700">Helpful Links</h4>
                  <p className="fs-6 text-white m-0">Soon </p>
                </Col>
                <Col>
                  <h4 className="fs-4 text-white fw-700">Contact Us</h4>
                  <p className="fs-6 text-white m-0">
                    <span>
                      <IoLocation className="header-line-2-icon" />&nbsp;
                      <a href="https://www.google.com/maps/place/India/@26.6729087,73.6587937,6z/data=!4m6!3m5!1s0x30635ff06b92b791:0xd78c4fa1854213a6!8m2!3d20.593684!4d78.96288!16zL20vMDNyazA?entry=ttu&g_ep=EgoyMDI1MDIxMi4wIKXMDSoASAFQAw%3D%3D" target="_blank" className="text-white">India</a>
                    </span>
                    <br />
                    <span>
                      <BsTelephoneFill size="0.9em" className="header-line-2-icon" />&nbsp;
                      <a href="tel:+919324616366" target="_blank" className="text-white">+91 9324616366</a>
                    </span>
                    <br />
                    <span>
                      <GrMail className="header-line-2-icon" />&nbsp;
                      <a href="mailto:devduttk30@gmail.com" target="_blank" className="text-white">devduttk30@gmail.com</a>
                    </span>
                  </p>
                  <div className="social-icon">
                    <ul>
                      <li><a href="https://www.facebook.com/" target="_blank"><BiLogoFacebook /></a></li>
                      <li><a href="https://twitter.com/" target="_blank"><AiOutlineTwitter /></a></li>
                      <li><a href="https://www.linkedin.com/" target="_blank"><BiLogoLinkedin /></a></li>
                      <li><a href="https://www.instagram.com/" target="_blank"><AiFillInstagram /></a></li>
                    </ul>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
          <Row>
            <Col>
              <p className="text-white text-center fs-6 mt-2 mb-1">
                {new Date().getFullYear()} All Rights Reserved. Developed & Designed by &nbsp;
                <a href="https://github.com/Devdutt3002/" target="_blank" className="text-primary">Devdutt3002</a>
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    }
  </>
};
export default Footer;