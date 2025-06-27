//using QFramework;
using System;
using System.Collections;
using System.Collections.Generic;
//using TMPro.Examples;
//using Unity.Collections.LowLevel.Unsafe;
using Unity.VisualScripting;
using UnityEngine;

public class CodeMaker : MonoBehaviour
{
  public static CodeMaker ins;

  private char[,] numberToLetter;
  private Dictionary<string, int> DeckData;
  private Dictionary<char, int> letterToNumber_x;
  private Dictionary<char, int> letterToNumber_y;
  private Dictionary<string, string> CodetoNumber;
  private Dictionary<string, string> ElementtoNumber;
  private Dictionary<string, string> NumbertoNumber;
  private Dictionary<string, string> CodetoNumber_alter;
  private Dictionary<string, string> ElementtoNumber_alter;
  private Dictionary<string, string> NumbertoNumber_alter;
  private void Awake()
  {
    ins = this;

    CodetoNumber = new Dictionary<string, string>();
    ElementtoNumber = new Dictionary<string, string>();
    NumbertoNumber = new Dictionary<string, string>();
    CodetoNumber_alter = new Dictionary<string, string>();
    ElementtoNumber_alter = new Dictionary<string, string>();
    NumbertoNumber_alter = new Dictionary<string, string>();
    letterToNumber_x = new Dictionary<char, int>();
    letterToNumber_y = new Dictionary<char, int>();
    Init_Dic();
    DeckData = new Dictionary<string, int>();
  }
  void Init_Dic()
  {
    CodetoNumber.Add("ex", "0"); CodetoNumber_alter.Add("0", "ex");
    CodetoNumber.Add("A", "1"); CodetoNumber_alter.Add("1", "A");
    CodetoNumber.Add("B", "2"); CodetoNumber_alter.Add("2", "B");
    CodetoNumber.Add("C", "3"); CodetoNumber_alter.Add("3", "C");
    CodetoNumber.Add("D", "4"); CodetoNumber_alter.Add("4", "D");
    CodetoNumber.Add("E", "5"); CodetoNumber_alter.Add("5", "E");
    CodetoNumber.Add("F", "6"); CodetoNumber_alter.Add("6", "F");
    CodetoNumber.Add("G", "7"); CodetoNumber_alter.Add("7", "G");
    CodetoNumber.Add("H", "8"); CodetoNumber_alter.Add("8", "H");

    ElementtoNumber.Add("A", "1"); ElementtoNumber_alter.Add("1", "A");
    ElementtoNumber.Add("S", "2"); ElementtoNumber_alter.Add("2", "S");
    ElementtoNumber.Add("M", "3"); ElementtoNumber_alter.Add("3", "M");
    ElementtoNumber.Add("D", "4"); ElementtoNumber_alter.Add("4", "D");

    NumbertoNumber.Add("1", "01"); NumbertoNumber_alter.Add("01", "1");
    NumbertoNumber.Add("2", "02"); NumbertoNumber_alter.Add("02", "2");
    NumbertoNumber.Add("3", "03"); NumbertoNumber_alter.Add("03", "3");
    NumbertoNumber.Add("4", "04"); NumbertoNumber_alter.Add("04", "4");
    NumbertoNumber.Add("5", "05"); NumbertoNumber_alter.Add("05", "5");
    NumbertoNumber.Add("6", "06"); NumbertoNumber_alter.Add("06", "6");
    NumbertoNumber.Add("7", "07"); NumbertoNumber_alter.Add("07", "7");
    NumbertoNumber.Add("8", "08"); NumbertoNumber_alter.Add("08", "8");
    NumbertoNumber.Add("9", "09"); NumbertoNumber_alter.Add("09", "9");

    

    numberToLetter = new char[,]{
      { 'A','I','Q','Y','g','o','w','5'},
      { 'B','J','R','Z','h','p','x','6'},
      { 'C','K','S','a','i','q','y','7'},
      { 'D','L','T','b','j','r','z','8'},
      { 'E','M','U','c','k','s','1','9'},
      { 'F','N','V','d','l','t','2','!'},
      { 'G','O','W','e','m','u','3','?'},
      { 'H','P','X','f','n','v','4','/'},
    };
    
    for(int i = 0; i < 8; i++)
    {
      for(int j = 0; j < 8; j++)
      {
        letterToNumber_x.Add(numberToLetter[i, j], j);
        letterToNumber_y.Add(numberToLetter[i, j], i);
      }
    }
  }

  /*
  public string MakeCode(List<Card> deckData)
  {
    string deckCode = "";
    DeckData = new Dictionary<string, int>();
    foreach (var card in deckData)
    {
      string id = card.id;
//      Debug.Log(id);
      if (DeckData.ContainsKey(id)) DeckData[id]++;
      else DeckData.Add(id, 1);
    }

    //Change 1:
    foreach (var kv in DeckData)
    {
      string[] strs = kv.Key.Split('-');
      if (strs.Length != 2) continue;
      string shopCode = strs[0].Substring(0, strs[0].Length - 1);
      string elementCode = strs[0].Substring(strs[0].Length - 1);
      string numberCode = strs[1];
      string code = "";
      if (CodetoNumber.ContainsKey(shopCode))
      {
        code += CodetoNumber[shopCode];
      }
      if (ElementtoNumber.ContainsKey(elementCode))
      {
        code += ElementtoNumber[elementCode];
      }
      if (NumbertoNumber.ContainsKey(numberCode))
      {
        code += NumbertoNumber[numberCode];
      }
      else code += numberCode;
      code += kv.Value.ToString();
      deckCode += code;
//      Debug.Log(code);
    }

    //Change 2:
    int ct = 0;
    List<int> code2 = new List<int>();
    while(ct < deckCode.Length)
    {
      string a = "";
      for (int i = 1; i <= 3 && ct < deckCode.Length; i++, ct++)
      {
        a += deckCode[ct];
      }
      int b = a.ToInt();
      code2.Add(b);
    }
    for (int i = 0; i < code2.Count; i++)
    {
      Debug.Log(code2[i]);
      code2[i] = 500 - code2[i];
    }
    
    //Change 3:
    List<string> code3 = new List<string>();
    string test = "";
    foreach (var num in code2)
    {
      int a = num;
      string num_2 = Convert.ToString(a, 2).PadLeft(10, '0');
      if (num < 0)
      {
        num_2 = num_2.Substring(num_2.Length - 10);
      }
//      Debug.Log(num + " to " + num_2);
      code3.Add(num_2);
      test += num_2 + ',';
    }
//    Debug.Log(test);
    deckCode = "";
    foreach (var str in code3)
    {
      deckCode += str;
    }

    //Change 4:
    int zeroCount1 = 0;
    while (deckCode.Length % 6 != 0)
    {
      deckCode += "0";
      zeroCount1++;
    }
//    Debug.Log(deckCode.Length + " Lenth : " + deckCode);
//    Debug.Log("zeroCount : " + zeroCount1);
    List<string> code4 = new List<string>();
    ct = 0;
    while (ct < deckCode.Length)
    {
      string st = "";
      for(int i = 1; i <= 3 && ct < deckCode.Length; i++, ct++)
      {
        st += deckCode[ct];
      }
      code4.Add(st);
 //       Debug.Log(st);
    }

    //Change 5:
    List<int> code5 = new List<int>();
    int zeroCount2 = 0;
    foreach (var item in code4)
    {
      int a = Convert.ToInt32(item, 2);
      code5.Add(a);
      if (a == 0) zeroCount2++;
    }
    deckCode = "";
    for(ct = 0; ct + 1 < code5.Count; ct += 2)
    {
      deckCode += numberToLetter[code5[ct], code5[ct + 1]];
    }
//    Debug.Log(deckCode);
//    Debug.Log("zeroCount : " + zeroCount2);

    //Change 6:
    int x = 7 - zeroCount1;
    int y = 7 - (zeroCount2 % 8);
    char key = numberToLetter[x, y];
    deckCode = "KCG-" + key + deckCode;

    return deckCode;
  }
  */


  public string ReadCode(string codeData)
  {
    string deckData = "";
    DeckData = new Dictionary<string, int>();
    //Change 6:
    deckData = codeData.Split('-')[1];
    char key = deckData[0];
    int zeroCount1 = 7 - letterToNumber_y[key];
    deckData = deckData.Substring(1);
    List<int> Code6 = new List<int>();
    foreach (var item in deckData)
    {
      Code6.Add(letterToNumber_y[item]);
      Code6.Add(letterToNumber_x[item]);
    }

    //Change 5:
    List<string> Code5 = new List<string>();
    deckData = "";
    foreach (var item in Code6)
      deckData += Convert.ToString(item, 2).PadLeft(3, '0');
    deckData = deckData.Substring(0, deckData.Length - zeroCount1);
    for(int i = 0; i < deckData.Length/10; i ++)
    {
      Code5.Add(deckData.Substring(i * 10, 10));
    }

    //Change 4 & 3:
    List<int> Code4 = new List<int>();
    foreach (var item in Code5)
    {
      if (item[0] == '0') Code4.Add(500 - Convert.ToInt32(item, 2));
      else Code4.Add(500 - Convert.ToInt32(item.PadLeft(32, '1'), 2));
    }
    deckData = "";

    /*
    for(int i = 0; i < Code4.Count; i++)
    {
      int item = Code4[i];
      string str = "";
      if (item >= 10 && item <= 100 && i < Code4.Count - 1) str = "0" + item.ToString();
      else if (item >= 1 && item <= 9 && i < Code4.Count - 1) str = "00" + item.ToString();
      else str = item.ToString();
      deckData += str;
    }
    Debug.Log(deckData);
    */
    
    deckData = "";
    int ct0 = 0;
    for(int i = 0; i < Code4.Count - 1; i++)
    {
      int item = Code4[i];
      string str = "";
      if (item >= 10 && item <= 100) str = "0" + item.ToString();
      else if (item >= 1 && item <= 9) str = "00" + item.ToString();
      else str = item.ToString();
      deckData += str;
      ct0 += 3;
    }
    if ((ct0 + Code4[Code4.Count - 1].ToString().Length) % 5 == 0) deckData += Code4[Code4.Count - 1].ToString();
    else if((ct0 + Code4[Code4.Count - 1].ToString().Length) % 5 == 4) deckData += "0" +  Code4[Code4.Count - 1].ToString();
    else if((ct0 + Code4[Code4.Count - 1].ToString().Length) % 5 == 3) deckData += "00" + Code4[Code4.Count - 1].ToString();
    Debug.Log(deckData);


    //Change 2:
    List<string> Code2 = new List<string>();
    for (int i = 0; i < deckData.Length / 5; i++)
    {
      Code2.Add(deckData.Substring(i * 5, 5));
      Debug.Log(deckData.Substring(i * 5, 5));
    }
    int ct = 0;
    deckData = "";
    foreach (string cardData in Code2)
    {
      Debug.Log(cardData);
      //int num = cardData.Substring(4).ToInt();
      int num = int.Parse( cardData.Substring(4) );
      string shopcode = cardData[0].ToString();
      string typecode = cardData[1].ToString();
      string no = cardData.Substring(2,2);

      // exまたはprmの場合、枚数から5を引く
      if (shopcode == "0") 
      {
          num -= 5;
      }

      string id = CodetoNumber_alter[shopcode];
      id += ElementtoNumber_alter[typecode];
      id += '-' + (NumbertoNumber_alter.ContainsKey(no) ? NumbertoNumber_alter[no] : no);
      for(int i = 1; i <= num; i++)
      {
        deckData += id + '/'; // me        
        ct++;
      }
    }
    deckData = deckData.TrimEnd('/'); // me
    Debug.Log(deckData);
    return deckData;
  }

}
