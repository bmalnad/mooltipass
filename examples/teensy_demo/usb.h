#ifndef usb_hid_h__
#define usb_hid_h__

#include <avr/interrupt.h>
#include <avr/pgmspace.h>
#include <avr/io.h>
#include <stdint.h>
#include <stdarg.h>
#include "defines.h"

/*** DEFINES ***/
#define VENDOR_ID           0x16D0              // Vendor ID (from MCS)
#define PRODUCT_ID          0x09A0              // Product ID (from MCS)
#define RAWHID_USAGE_PAGE   0xFF31              // HID usage page, after 0xFF00: vendor-defined
#define RAWHID_USAGE        0x0074              // HID usage
#define STR_MANUFACTURER    L"Mooltipass"       // Manufacturer string
#define STR_PRODUCT         L"Mooltipass"       // Product string
#define ENDPOINT0_SIZE      32                  // Size for endpoint 0
#define RAWHID_INTERFACE    0                   // Interface for the raw HID
#define RAWHID_TX_ENDPOINT  1                   // Raw HID TX endpoint
#define RAWHID_RX_ENDPOINT  2                   // Raw HID RX endpoint
#define RAWHID_TX_SIZE      32                  // Raw HID transmit packet size, revert to 64 soon!
#define RAWHID_RX_SIZE      32                  // Raw HID receive packet size, revert to 64 soon!
#define RAWHID_TX_BUFFER    EP_DOUBLE_BUFFER    // Double buffer
#define RAWHID_RX_BUFFER    EP_DOUBLE_BUFFER    // Double buffer
#define KEYBOARD_INTERFACE  1                   // Interface for keyboard
#define KEYBOARD_ENDPOINT   3                   // Endpoint number for keyboard
#define KEYBOARD_SIZE       8                   // Endpoint size for keyboard
#define KEYBOARD_BUFFER     EP_DOUBLE_BUFFER    // Double buffer
#define USB_WRITE_TIMEOUT   50                  // Timeout for writting in the pipe

// Endpoint defines
#define EP_SIZE(s)  ((s) > 32 ? 0x30 : ((s) > 16 ? 0x20 : ((s) > 8  ? 0x10 : 0x00)))
#define EP_TYPE_CONTROL             0x00
#define EP_TYPE_BULK_IN             0x81
#define EP_TYPE_BULK_OUT            0x80
#define EP_TYPE_INTERRUPT_IN        0xC1
#define EP_TYPE_INTERRUPT_OUT       0xC0
#define EP_TYPE_ISOCHRONOUS_IN      0x41
#define EP_TYPE_ISOCHRONOUS_OUT     0x40
#define EP_SINGLE_BUFFER            0x02
#define EP_DOUBLE_BUFFER            0x06
#define MAX_ENDPOINT                4

// Macros
#define LSB(n) (n & 255)
#define MSB(n) ((n >> 8) & 255)
#define HW_CONFIG() (UHWCON = 0x01)
#define PLL_CONFIG() (PLLCSR = 0x12)
#define USB_CONFIG() (USBCON = ((1<<USBE)|(1<<OTGPADE)))
#define USB_FREEZE() (USBCON = ((1<<USBE)|(1<<FRZCLK)))

// Standard control endpoint request types
#define GET_STATUS              0
#define CLEAR_FEATURE           1
#define SET_FEATURE             3
#define SET_ADDRESS             5
#define GET_DESCRIPTOR          6
#define GET_CONFIGURATION       8
#define SET_CONFIGURATION       9
#define GET_INTERFACE           10
#define SET_INTERFACE           11

// HID (human interface device)
#define HID_GET_REPORT          1
#define HID_GET_IDLE            2
#define HID_GET_PROTOCOL        3
#define HID_SET_REPORT          9
#define HID_SET_IDLE            10
#define HID_SET_PROTOCOL        11

/** Function prototypes **/
void usb_init(void);                                            // initialize everything
uint8_t usb_configured(void);                                   // is the USB port configured
int8_t usb_rawhid_recv(uint8_t* buffer, uint8_t timeout);       // receive a packet, with timeout
int8_t usb_rawhid_send(uint8_t* buffer, uint8_t timeout);       // send a packet, with timeout
int8_t usb_keyboard_press(uint8_t key, uint8_t modifier);
int8_t usb_keyboard_send(void);
extern uint8_t keyboard_modifier_keys;
extern uint8_t keyboard_keys[6];
extern volatile uint8_t keyboard_leds;

RET_TYPE usbPutstr(const char *str);
RET_TYPE usbPutstr_P(const char *str);
int usbPrintf(const char* fmt, ...) __attribute__((format(printf, 1, 2)));
int usbPrintf_P(const char *fmt, ...) __attribute__((format(printf, 1, 2)));

#endif
