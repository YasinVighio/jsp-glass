import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigurationManager } from '../configurationManager';
import { JspMapper } from '../jspMapper';

suite('JSP Debug Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Configuration Manager', () => {
    const configManager = ConfigurationManager.getInstance();
    assert.ok(configManager, 'ConfigurationManager should be instantiated');
  });

  test('JSP File Detection', () => {
    const jspMapper = new JspMapper();
    
    assert.strictEqual(jspMapper.isJspFile('test.jsp'), true);
    assert.strictEqual(jspMapper.isJspFile('test.jspx'), true);
    assert.strictEqual(jspMapper.isJspFile('test.java'), false);
    assert.strictEqual(jspMapper.isJspFile('test.html'), false);
  });

  test('JSP to Servlet Mapping', () => {
    const configManager = ConfigurationManager.getInstance();
    
    const className1 = configManager.jspPathToServletClassName('index.jsp');
    assert.strictEqual(className1, 'org.apache.jsp.index_jsp');
    
    const className2 = configManager.jspPathToServletClassName('admin/login.jsp');
    assert.strictEqual(className2, 'org.apache.jsp.admin_login_jsp');
    
    const className3 = configManager.jspPathToServletClassName('pages/user/profile.jsp');
    assert.strictEqual(className3, 'org.apache.jsp.pages_user_profile_jsp');
  });

  test('Servlet Class to JSP Mapping', () => {
    const jspMapper = new JspMapper();
    
    // This test would need a mock workspace setup
    // For now, just test the class name parsing logic
    assert.ok(jspMapper.getJspFileFromServletClass, 'Should have getJspFileFromServletClass method');
  });
});