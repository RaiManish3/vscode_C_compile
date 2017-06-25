#include<stdio.h>
#include<string.h>

int main(){
  char a[]="fpga";
  char b[2];
  strcpy(b,a);
  char c;
  puts(&c);
  b[5]='a';
  //gets(&c);
  printf("%s",a);
  return 0;
}
